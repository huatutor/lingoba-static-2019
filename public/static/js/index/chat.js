   var Vchat = new Vue({
        el:'.MessagingWrapper',
        data:{showlxr:'', skey:'', userlist:{}, lsort:[], dx:{}, searchlist:[], loading:false, disable:false,
            msg:'', keyenter:true, 
            imgData: {accept: 'image/jpeg, image/png, image/jpg,application/pdf'},
            usr:{username:'',avatar:'',realname:''}, 
            contents:[], iam:{username:'yefei',avatar:'/static/img/avatar.png',realname:'叶飞'},
            token:'', wsTimer:0, wsReadyState:0,  records:{}, 
            connectflag:false,
            wsstatus: '', // WebSocket状态
            reconnectTimer: null, // 重连定时器
            reconnectAttempts: 0, // 重连尝试次数
            maxReconnectAttempts: 5, // 最大重连次数
            // 无限滚动相关属性
            hasMoreData: true, // 是否还有更多数据
            isLoadingMore: false, // 是否正在加载更多数据
            scrollContainer: null, // 滚动容器引用
            isScrollInitialized: false, // 滚动监听是否已初始化
            scrollDebounceTimer: null, // 滚动防抖定时器
        },
        components:{
            'notice':notice,
        },
        beforemount(){
            // localStorage.setItem('chat',this.active);
        },
        mounted(){
            this.whoami();
            this.connectws();
            // 延时初始化滚动监听，避免页面刚加载就触发
            setTimeout(() => {
                this.initScrollListener();
            }, 2000); // 延时2秒后启用滚动监听
        },
        beforeDestroy() {
            clearInterval(this.wsTimer);
            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer);
            }
            // 清理防抖定时器
            if (this.scrollDebounceTimer) {
                clearTimeout(this.scrollDebounceTimer);
            }
            // 解绑滚动事件监听器
            if (this.scrollContainer) {
                this.scrollContainer.removeEventListener('scroll', this.handleScrollDebounced);
            }
        },
        methods:{
            test(){
                console.log(this.usr,51)
            },
            whoami(){
                 let _usr = sessionStorage.getItem('_usr');
                 
                 if(!_usr){
                    axios.post('/index/index/getlocalstorage').then(re=>{
                        _usr = re.data.usr;
                        if(re.data.usr.username=='guest'){
                            sessionStorage.removeItem('_usr');
                        }else{
                            sessionStorage.setItem('_usr',JSON.stringify(_usr));
                        }
                        localStorage.setItem('_token',re.data.token);
                        if(!_usr){
                            alert(LANG.chat.please_login_first);return false;
                        }
                        this.iam = _usr;
                    })
                }else{
                    this.iam = JSON.parse(_usr);
                }
            },
            getuserlist(){
                axios.post('/chat/index/getuserlist').then(re=>{
                        this.userlist = re.data.list;
                        this.lsort = re.data.lsort;
                        // console.log(this.lsort, this.userlist);
                        // 获取当前需要显示的好友id
                        let active = localStorage.getItem('chat');
                        if (active) {
                            if (this.userlist[active]) {
                                this.usr = this.userlist[active];
                                // 选择用户后获取聊天记录
                                this.selectuser(this.usr.username);
                                this.getunreadcount();
                            } else {
                                // 用户不在列表中，先获取用户信息
                                this.newuser(active).then(() => {
                                    this.usr = this.userlist[active];
                                    // 选择用户后获取聊天记录
                                    this.selectuser(this.usr.username);
                                    this.getunreadcount();
                                }).catch(() => {
                                    // 如果获取用户信息失败，选择第一个用户
                                    this.usr = this.userlist[Object.keys(this.userlist)[0]];
                                    localStorage.setItem('chat', this.usr.username);
                                    // 选择用户后获取聊天记录
                                    this.selectuser(this.usr.username);
                                    this.getunreadcount();
                                });
                                return; // 等待异步操作完成
                            }
                        } else {
                            // 如果没有active用户，默认选择第一个用户
                            this.usr = this.userlist[Object.keys(this.userlist)[0]];
                            localStorage.setItem('chat',this.usr.username);
                            // 选择用户后获取聊天记录
                            this.selectuser(this.usr.username);
                            this.getunreadcount();
                        }
                })
            },
            selectuser(user){
                this.usr = this.userlist[user];
                localStorage.setItem('chat',user);
                
                // 重置无限滚动状态
                this.hasMoreData = true;
                this.isLoadingMore = false;
                this.isScrollInitialized = false; // 重置滚动初始化状态
                
                // 获取本地存储的聊天记录
                const storageKey = `Message_${user}`;
                const stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
                
                // 先加载本地消息到this.contents，确保立即显示
                if (stored.messages && stored.messages.length > 0) {
                    this.contents = stored.messages;
                    setTimeout(() => {
                        // 滚动到未读消息位置
                        this.scrollToUnreadMessage();
                        setTimeout(()=>{
                            this.sethasread();
                        },1000)
                         
                    }, 500);
                } else {
                    this.contents = [];
                }
                
                const localUpdateTime = Math.floor((stored.updatetime || 0) ); // 秒
                // 获取服务器最新消息时间（秒）
                const serverSendTime = this.usr.sendtime || 0;

                // 如果本地更新时间早于服务器发送时间，则执行更新
                if (localUpdateTime < serverSendTime) {
                    this.getrecords();
                }
                if(this.ismobile()){
                    this.back();
                }
            },
            getunreadcount(){
                axios.post('/chat/index/getunreadcount').then(re=>{
                    
                    for (let username in re.data) {
                        if (this.userlist[username]) {
                            this.userlist[username].unread = re.data[username];
                            // 触发Vue响应式更新
                            this.$set(this.userlist, username, this.userlist[username]);
                        }
                    }
                    
                })
            },
            getrecords(){
                axios.post('/chat/index/read',{user:this.usr.username}).then(re=>{
                    // 记录已出现的日期，用于判断是否为当天第一条
                    let seenDates = new Set();
                    let tmp = [];
                    for (let ix in re.data.data) {
                        let item = this.formatdata(re.data.data[ix]);
                        // 如果该日期未出现过，则标记为第一条
                        if (!seenDates.has(item.date)) {
                            item.isFirstOfDay = true;
                            seenDates.add(item.date);
                        } else {
                            item.isFirstOfDay = false;
                        }
                        tmp.push(item);
                    }
                    // 将当前聊天对象 usr 的用户名作为 key，把 tmp 写入 localStorage.chatrecords[this.usr.username]
                    if (this.usr && this.usr.username) {
                        const key = `Message_${this.usr.username}`;
                        let stored = JSON.parse(localStorage.getItem(key) || '[]');
                        // 增加一个 upadteTime 字段，记录本次存储时间
                        const records = {
                            updatetime: Math.floor(Date.now() / 1000),
                            messages: tmp
                        };
                        // 只保留最近 50 条
                        if (records.messages.length > 50) records.messages = records.messages.slice(-50);
                        localStorage.setItem(key, JSON.stringify(records));
                        
                        // 将更新后的消息数据赋值给this.contents
                        this.contents = records.messages;

                        setTimeout(() => {
                             this.scrollToUnreadMessage();
                        }, 500);
                    }
                })
            },
            
            // 显示联系人
            showlist() {
                if(this.ismobile){
                    this.showlxr = 'show';
                }else{
                    this.showlxr = '';
                }
            },
            back(){
                this.showlxr = '';
            },
            ismobile(){
                return screen.width < 768?true:false;
            },
            unreadcount(){
                let count = 0;
                for (let username in this.userlist) {
                    count += this.userlist[username].unread || 0;
                }
                return count;
            },
            // 滚动到未读消息位置
            scrollToUnreadMessage(){
                // 使用Vue的nextTick确保DOM已更新
                this.$nextTick(() => {
                    // 检查当前用户是否有未读消息
                    if (this.usr && this.usr.unread > 0) {
                        // 查找第一条未读消息（status为0的消息）
                        const firstUnreadMessage = this.contents.find(msg => msg.status === 0 && msg.self !== 'self');
                        
                        if (firstUnreadMessage && firstUnreadMessage.id) {
                            const targetElement = document.getElementById('id_' + firstUnreadMessage.id);
                            if (targetElement) {
                                targetElement.scrollIntoView({
                                    behavior: 'instant',
                                    block: 'center'
                                });
                            } else {
                                // 未找到消息元素时也滚动到底部
                                const chatEndElement = document.getElementById('chat_end');
                                    chatEndElement.scrollIntoView({ behavior: 'instant', block: 'end' });
                            }
                        }  
                    } else {
                        // 滚动到聊天区域底部
                        const chatEndElement = document.getElementById('chat_end');
                        chatEndElement.scrollIntoView({ behavior: 'instant', block: 'end' });
                    }
                })
            },
            
            // 初始化滚动监听器
            initScrollListener() {
                this.$nextTick(() => {
                    this.scrollContainer = document.querySelector('.ScrollbarsCustom-Scroller');
                    if (this.scrollContainer && this.contents.length > 0) {
                        this.scrollContainer.addEventListener('scroll', this.handleScrollDebounced);
                        this.isScrollInitialized = true;
                        
                    } else {
                        // 如果还没有内容，延时重试
                        setTimeout(() => {
                            this.initScrollListener();
                        }, 1000);
                    }
                });
            },
            
            // 防抖处理的滚动事件
            handleScrollDebounced() {
                if (this.scrollDebounceTimer) {
                    clearTimeout(this.scrollDebounceTimer);
                }
                this.scrollDebounceTimer = setTimeout(() => {
                    this.handleScroll();
                }, 100); // 100ms防抖
            },
            
            // 处理滚动事件，检测是否需要加载更多记录
            handleScroll() {
                // 检查初始化状态
                if (!this.isScrollInitialized || !this.scrollContainer || this.isLoadingMore || !this.hasMoreData) {
                    return;
                }
                
                // 确保有聊天内容才处理滚动
                if (!this.contents || this.contents.length === 0) {
                    return;
                }
                
                // 检测是否滚动到顶部附近（50px内）
                if (this.scrollContainer.scrollTop <= 50) {
                    this.loadMoreRecords();
                }
            },
            
            // 加载更多聊天记录
            loadMoreRecords() {
                if (this.isLoadingMore || !this.hasMoreData || !this.usr || !this.usr.username) {
                    return;
                }
                
                // 获取当前最早的消息ID
                let earliestMsgId = null;
                if (this.contents && this.contents.length > 0) {
                    earliestMsgId = this.contents[0].id;
                }
                
                if (!earliestMsgId) {
                    console.log('没有找到最早的消息ID，无法加载更多记录');
                    this.hasMoreData = false;
                    return;
                }
                
                this.isLoadingMore = true;
                
                // 保存当前滚动位置
                const currentScrollHeight = this.scrollContainer.scrollHeight;
                
                // 调用后端API获取历史记录，使用msg_id而不是分页
                axios.post('/chat/index/gethistory', {
                    user: this.usr.username,
                    before_msg_id: earliestMsgId,
                    limit: 20 // 每次加载20条记录
                }).then(response => {
                    if (response.data && response.data.data && response.data.data.length > 0) {
                        // 格式化新数据
                        let newMessages = [];
                        let seenDates = new Set();
                        
                        // 先收集已有消息的日期
                        this.contents.forEach(msg => {
                            if (msg.date) seenDates.add(msg.date);
                        });
                        
                        for (let item of response.data.data) {
                            let formattedItem = this.formatdata(item);
                            // 检查是否为当天第一条
                            if (!seenDates.has(formattedItem.date)) {
                                formattedItem.isFirstOfDay = true;
                                seenDates.add(formattedItem.date);
                            } else {
                                formattedItem.isFirstOfDay = false;
                            }
                            newMessages.unshift(formattedItem); // 倒序插入
                        }
                        
                        // 将新消息插入到contents数组开头
                        this.contents = [...newMessages, ...this.contents];
                        
                        // 检查是否还有更多数据
                        if (response.data.data.length < 20) {
                            this.hasMoreData = false;
                            console.log('已加载所有历史记录');
                        }
                        
                        // 保持滚动位置
                        this.$nextTick(() => {
                            const newScrollHeight = this.scrollContainer.scrollHeight;
                            const scrollDiff = newScrollHeight - currentScrollHeight;
                            this.scrollContainer.scrollTop = scrollDiff + 50; // 稍微偏移一点
                        });
                        
                        console.log(`成功加载${newMessages.length}条历史记录`); 
                    } else {
                        // 没有更多数据
                        this.hasMoreData = false;
                        console.log('没有更多历史记录');
                    }
                }).catch(error => {
                    console.error('加载历史记录失败:', error);
                }).finally(() => {
                    this.isLoadingMore = false;
                });
            },
            
            formatdata_gtext(data){
                let timestamp, content, self;

                if (data.hasOwnProperty('stamp')) {
                    timestamp = data.stamp;  
                    content = data.data;
                    self = data.from === this.iam.username ? 'self' : '';
                } else {
                    content = data.content || '';
                    timestamp = data.sendtime;
                    self = data.sender === this.iam.username ? 'self' : '';
                }

                const dateObj = new Date(timestamp * 1000);
                const date = dateObj.toLocaleDateString(); // 日期
                const sendtime = dateObj.toLocaleTimeString(); // 时间
                const status = 1; // 默认为0
                    
                return {
                    date: date,
                    id: data.msg_id,
                    self: self,
                    stamp: timestamp,
                    sendtime: sendtime,
                    type: data.type,
                    status: status,
                    title: data.title || '',
                    content: content
                };
            },
            // 格式化聊天记录
            formatdata(data){
                // 检测数据格式
                // 格式1: {type, to, from, data: {text}, stamp, msg_id}
                // 格式2: {username, sender, msg_id, content, sendtime}
                if(data.type == 'gtext'){
                    return this.formatdata_gtext(data);
                }
                
                if (data.hasOwnProperty('stamp') && data.hasOwnProperty('from') && data.hasOwnProperty('data')) {
                    // 格式1处理
                    // 格式化时间戳为日期和时间
                    const timestamp = data.stamp;  
                    const dateObj = new Date(timestamp*1000);
                    const date = dateObj.toLocaleDateString(); // 日期
                    const sendtime = dateObj.toLocaleTimeString(); // 时间
                    const status = data.status || 0; // 默认为0
                    const content = data.data.text || '';
                     
                    
                    // 判断是否为当前用户发送的消息
                    const self = data.from === this.iam.username ? 'self' : '';
                    // 返回格式化后的数据
                    return {
                        date: date,
                        id: data.msg_id,
                        self: self,
                        stamp: timestamp,
                        sendtime: sendtime,
                        type: data.type,
                        status: status,
                        title: data.title || '',
                        content: content
                    };
                } else if (data.hasOwnProperty('sendtime') && data.hasOwnProperty('username')) {
                    // 格式2处理
                    // 格式化时间戳为日期和时间
                    const timestamp = data.sendtime; // 转换为毫秒
                    const dateObj = new Date(timestamp*1000);
                    const date = dateObj.toLocaleDateString(); // 日期
                    const sendtime = dateObj.toLocaleTimeString(); // 时间
                    const status = data.status || 0; // 默认为0
                    
                    // 判断是否为当前用户发送的消息
                    const self = data.sender === this.iam.username ? 'self' : '';
                    
                    // 返回格式化后的数据
                    return {
                        date: date,
                        id: data.msg_id,
                        self: self,
                        stamp: timestamp,
                        sendtime: sendtime,
                        type: data.type || 'chat', // 如果没有type字段，默认为chat
                        status: status,
                        title: data.title || '',
                        content: data.content
                    };
                } else {
                    // 未知格式，返回原数据
                    console.warn('Unknown data format:', data);
                    return data;
                }
            },
            // 从localStorage加载聊天记录
            loadChatFromStorage(user){
                if(!user) return;
                
                const storageKey = `chat_records`;
                const chatRecors = localStorage.getItem(storageKey);
                
                if(chatRecors && chatRecors[user]) {
                    try {
                        const messages = JSON.parse(chatRecors[user]);
                        // 如果有本地聊天记录，先显示本地记录
                        if(messages && messages.length > 0) {
                            console.log(`从localStorage加载${user}的聊天记录，共${messages.length}条`);
                            // 这里可以选择是否要与服务器数据合并，暂时先显示本地数据
                        }
                    } catch(e) {
                        console.error('解析本地聊天记录失败:', e);
                    }
                }
            },
            // 保存聊天记录到localStorage
            saveChatToStorage(user, messageData){
                if(!user) return;
                // 格式化消息用于显示
                const formattedMessage = this.formatdata(messageData);
                // console.log('formatdata',formattedMessage,834);
                // 1. 插入到contents数组中
                if((messageData.from == this.usr.username || messageData.from == this.iam.username) && messageData.type == 'chat'){
                        formattedMessage.content = formattedMessage.content.replace(/\n/g, '<br>');
                    this.contents.push(formattedMessage);
                }
                if((messageData.from == this.usr.username || messageData.from == this.iam.username) && messageData.type == 'gtext'){
                    // 图文消息 
                    this.contents.push(formattedMessage);
                }
                // 2. 保存到localStorage
                const storageKey = `Message_${user}`;
                let stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
                if (!stored.messages) {
                    stored.messages = [];
                }
                stored.messages.push(formattedMessage);
                stored.updatetime = Math.floor(Date.now() / 1000);
                // 保持最多50条记录
                if (stored.messages.length > 50) {
                    stored.messages = stored.messages.slice(-50);
                }
                localStorage.setItem(storageKey, JSON.stringify(stored));
            },
             
            connectws(){
                // 关闭之前的连接
                if (this.ws) {
                    this.ws.close();
                }
                // 清除之前的定时器
                if (this.wsTimer) {
                    clearInterval(this.wsTimer);
                }
                
                this.connectflag = true;
                // console.log('正在建立WebSocket连接...');
                this.ws = new WebSocket(wsshost+'?uid='+this.iam.username+'&type=chat');
                
                // 定时监控 readyState
                this.wsTimer = setInterval(() => {
                    if (this.ws) {
                        this.wsstatus = this.ws_status();
                        if (this.ws.readyState === WebSocket.CLOSED) {
                            clearInterval(this.wsTimer); // 已关闭就不用再监控
                        }
                    }
                }, 1000);
                // this.ws = new WebSocket(wsshost);
                this.ws.onopen = () => {
                    // console.log('WebSocket连接已建立');
                    this.wsReadyState = this.ws.readyState;
                    this.getuserlist(); 
                };
                 
                this.ws.onclose = (event) => {
                    console.log('WebSocket连接已关闭', event);
                    this.wsReadyState = this.ws.readyState;
                    this.connectflag = false;
                };
                
                this.ws.onerror = (error) => {
                    console.log('WebSocket连接错误', error);
                    this.wsReadyState = this.ws.readyState;
                };
                
                // WebSocket消息接收事件
                this.ws.onmessage = (evt) => {
                    // 接收到消息时更新状态（确保连接正常）
                    this.handleMessage(evt);
                };
                 
            },
            ws_status(){
                let rs = this.ws.readyState;
                this.wsReadyState = rs;
                switch (rs) {
                    case 0:
                        this.disable = true;
                        return LANG.chat.establishing_connection;
                        break;
                    
                    case 1:
                        this.disable = false;
                        return '<span style="color:green">● '+LANG.chat.connected+'</span>';    
                        break;
                    
                    case 2:
                        this.disable = true;
                        return LANG.chat.closing;
                        break;
                    
                    case 3:
                        this.disable = true;
                        return '<span style="color:red">● '+LANG.chat.unable_to_connect_server+'</span>';
                        break;
                    
                    default:
                        this.disable = true;
                        return LANG.chat.connecting_server;
                        break;
                }
            },
             
            // WebSocket消息处理函数
            handleMessage(evt) {
                try {
                    const data = JSON.parse(evt.data);
                    
                    // 根据消息类型进行处理
                    switch(data.type) {
                        case 'heartbeat_response':
                            console.log('收到心跳响应');
                            break;
                        case 'userlist':
                            // console.log('收到用户列表');
                            break;
                        case 'chat':
                            // console.log('收到聊天消息');
                            this.saveChatToStorage(data.from, data);
                            this.updata_list(data.from, data);
                            if(data.from == this.usr.username){
                                this.goBottom();
                            }
                            break;
                        case 'gtext':
                            // console.log('收到聊天消息');
                            this.saveChatToStorage(data.from, data);
                            this.updata_list(data.from, data);
                            if(data.from == this.usr.username){
                                this.goBottom(); 
                            }
                            break;
                        case 'gtextback':
                            this.gtextcallback(data);
                            break;
                        default:
                            console.log('未知消息类型:', data.type);
                    }
                } catch (error) {
                    console.error('解析WebSocket消息失败:', error);
                }
            },
            updata_list(user, data){
                // console.log('updata_list', user, data,940);
                // 2) 检查lsort中是否存在，不存在执行this.newuser(user)
                const userExistsInLsort = this.lsort.includes(user);
                if (!userExistsInLsort) {
                    // 执行newuser并等待完成
                    this.newuser(user);
                    // 由于newuser可能是异步的，使用nextTick确保执行完成后继续
                    this.$nextTick(() => {
                        this.continueUpdateList(user, data);
                    });
                } else {
                    // 直接继续执行后续步骤
                    this.continueUpdateList(user, data);
                }
            },
            
            continueUpdateList(user, data) {
                // 3) lsort中user移到首位
                const userIndex = this.lsort.indexOf(user);
                if (userIndex > -1) {
                    // 移除用户
                    this.lsort.splice(userIndex, 1);
                }
                // 添加到首位
                this.lsort.unshift(user);
                // 4) 更新userlist[user]的sendtime, summary, unread++, date数据
                if (this.userlist[user]) {
                    // 更新sendtime
                    this.userlist[user].sendtime = data.stamp;
                    
                    // 更新summary（消息内容摘要）
                    if (data.data.text) {
                        this.userlist[user].summary = data.data.text;
                    }
                    // 增加未读消息数
                    if (!this.userlist[user].unread) {
                        this.userlist[user].unread = 0;
                    }
                    if(data.from != this.iam.username){
                        this.userlist[user].unread++;
                    }
                    // 更新date（格式化的时间）
                    const date = new Date(data.stamp * 1000);
                    this.userlist[user].date = date.toLocaleString();
                    
                    // 触发Vue响应式更新
                    this.$set(this.userlist, user, this.userlist[user]);
                }
            },
            newuser(user){
                console.log('新用户加入:', user);
                return axios.post('/chat/newchat',{user:user}).then(re=>{
                        let nus = re.data.user[user];
                        console.log('nus', nus);
                        this.lsort.unshift(nus.username);
                        this.userlist[nus.username] = {
                            realname: nus.realname,
                            username: nus.username,
                            avatar: nus.avatar,
                            usertype: nus.usertype,
                            online: nus.online,
                            sendtime: '',
                            summary: '',
                            unread: 0,
                            date: '',
                        };
                        return nus;
                });
            },
            // 处理重连逻辑
            handleReconnect() {
                // 如果已经达到最大重连次数，停止重连
                if (this.reconnectAttempts >= this.maxReconnectAttempts) {
                    console.log(`已达到最大重连次数(${this.maxReconnectAttempts})，停止重连`);
                    return;
                }
                
                // 清除之前的重连定时器
                if (this.reconnectTimer) {
                    clearTimeout(this.reconnectTimer);
                }
                
                this.reconnectAttempts++;
                const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts - 1), 30000); // 指数退避，最大30秒
                
                console.log(`第${this.reconnectAttempts}次重连尝试，${delay}ms后开始重连...`);
                
                this.reconnectTimer = setTimeout(() => {
                    console.log('开始重连WebSocket...');
                    this.connectws();
                }, delay);
            },
            keydown(e){
                if(e.keyCode == 13 && this.keyenter){
                     this.send();
                     e.preventDefault()
                     return false;
                }
            },
            add_img (event) {
                if(this.disable){return false}
                let _this = this
                var files = event.target.files[0]
                if (!event || !window.FileReader) return  // 看支持不支持FileReader
                let reader = new FileReader()
                reader.readAsDataURL(files) // 这里是最关键的一步，转换就在这里
                reader.onloadend = function () {
                // _this.avatar = this.result
                }
                //以上是缩略图部分代码this.result就是url，赋值给了默认的src
                
                let img1 = event.target.files[0];
                
                let type = img1.type;
                let size = img1.size;
                
                if (this.imgData.accept.indexOf(type) === -1) {  
                    // console.log('支持上传的格式不对');
                    Vtmp.$emit('showannc',{msg:LANG.chat.supported_upload_formats,"status":"fail"});
                    return false;  
                }  
                //以上对文件格式的限制，imgData在return里面可见
                if (size>5242880) {  
                    // console.log('上传文件不能大于5m')
                    Vtmp.$emit('showannc',{msg:LANG.chat.file_size_limit,"status":"fail"});
                    return false;  
                }  
                //以上对图片大小的限制
                var form = new FormData();
                form.append('file',img1);
                // console.log(form.get('file'));
                axios.post('/chat/index/uploadimg',form,{
                    headers:{'Content-Type':'multipart/form-data'},
                    withCredentials:true,
                    
                }).then(re => {  
                    // console.log(re);
                    if(re.data.status=='ok'){
                        let url = re.data.file_url;//上传成功的返回url
                        var tp = re.data.ext=='pdf'?'attachment':'picture';
                        var pp = {
                            "to":this.usr.username,
                            "title":this.msg,
                            type: "gtext",
                            "data":{
                                "ext":re.data.ext,
                                "type":tp,
                                "url":url,
                            },
                            "url" : url,
                            "from":this.iam.username,
                            "msg_id":0,
                        };
                        // console.log(pp);
                        this.msg = '';
                        this.ws.send(JSON.stringify(pp));
                    }
                    
              
                }).catch(error => {  
                    console.log('失败'+error);
                })     
                //还可以在其中尝试更多的东西我暂时尝试到这里了
            },
            gtextcallback(data){
                  // 格式1处理
                // 格式化时间戳为日期和时间
                    const timestamp = data.stamp;  
                    const dateObj = new Date(timestamp*1000);
                    const date = dateObj.toLocaleDateString(); // 日期
                    const sendtime = dateObj.toLocaleTimeString(); // 时间
                    const user = this.usr.username; 
                     
                    // 返回格式化后的数据
                    var new_data =  {
                        date: date,
                        id: data.msg_id,
                        self: 'self',
                        stamp: timestamp,
                        sendtime: sendtime,
                        type: 'gtext',
                        status: 1,
                        title: data.title || '',
                        content: data.data
                    };
                    this.contents.push(new_data);
                
                // 2. 保存到localStorage
                const storageKey = `Message_${user}`;
                let stored = JSON.parse(localStorage.getItem(storageKey) || '{}');
                if (!stored.messages) {
                    stored.messages = [];
                }
                stored.messages.push(new_data);
                stored.updatetime = Math.floor(Date.now() / 1000);
                this.goBottom(0);
            },
            send(){
                // 发送前检查连接状态并更新状态
                if (this.ws && this.ws.readyState === 1) {
                    // 发送消息的逻辑
                    // console.log('可以发送消息');
                    
                    // 创建消息对象
                    const now = Date.now();
                    const currentTime = new Date();
                    const messageData = {
                        type: 'chat',
                        from: this.iam.username,
                        to: this.usr.username,
                        data: {text: this.msg},
                        stamp: Math.floor(Date.now() / 1000), // 时间戳（秒）
                        msg_id: 0,
                    };
                    
                    this.saveChatToStorage(this.usr.username, messageData);
                    // 发送消息到服务器
                    this.ws.send(JSON.stringify(messageData));
                    // 5. 清空输入框
                    this.msg = '';
                    
                    // 6. 滚动到聊天区域底部显示最新内容
                    this.goBottom(0);
                    this.updata_list(this.usr.username, messageData);
                } else {
                    console.log('WebSocket未连接，无法发送消息');
                }
            },
            goBottom(sethasread=1){
                const chatContainer = document.querySelector('.ScrollbarsCustom-Scroller');
                
                setTimeout(() => {
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                    this.sethasread(sethasread);
                }, 200);
            },
            // 3秒后设置为已读
            sethasread(sethasread=1){
                if(!sethasread) return false;   
                const currentUser = this.userlist[this.usr.username];
                if(!currentUser.unread) return false;
                setTimeout(()=>{
                    // 设置当前用户的未读消息为0
                       if(currentUser) {
                            currentUser.unread = 0;
                        }
                    // 发送已读消息给服务器
                    this.ws.send(JSON.stringify({
                        action: 'set_hasread',
                        user: this.usr.username,
                        iam: this.iam.username
                    }));
                },2000)
            },
        },
        watch: {
            // 监听WebSocket状态变化
            wsReadyState(newState, oldState) {
                // console.log(`WebSocket状态变化: ${oldState} -> ${newState}`);
                
                // 当状态为3（CLOSED）时，触发重连
                if (newState === 3) {
                    // console.log('WebSocket连接已关闭，准备重连...');
                    this.handleReconnect();
                }
                
                // 当连接成功时，重置重连计数器
                if (newState === 1) {
                    this.reconnectAttempts = 0;
                    // console.log('WebSocket连接成功，重置重连计数器');
                }
            },
            // 监听搜索关键词变化
            skey(newVal) {
                if (!newVal || newVal.trim() === '') {
                    // 如果搜索关键词为空，清空搜索结果
                    this.searchlist = [];
                    return;
                }
                
                // 将搜索关键词转为小写进行不区分大小写的搜索
                const keyword = newVal.toLowerCase();
                this.searchlist = [];
                
                // 遍历用户列表进行搜索
                for (let userId in this.userlist) {
                    const user = this.userlist[userId];
                    // 检查username和realname是否包含搜索关键词
                    if ((user.username && user.username.toLowerCase().includes(keyword)) ||
                        (user.realname && user.realname.toLowerCase().includes(keyword))) {
                        this.searchlist.push(user);
                    }
                }
            }
        },
         
        
    })
 