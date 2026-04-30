
var loginhead = {
    //登录后的页头菜单
      template:'#lghead',
      data(){
        return{
          alert:{
            css:'',
            num:'0',
            items:[]}, //通知提醒数
          msg:{
            css:'',
            num:0,
            items:{},
            cc:0,
            important:0 //重要通知才提醒
          },
          ws:'',
          lastConnectionTime:0,
          kstamp:'',
          clock:'',
          hourclock:24, script:null,
          user:{realname:'',avatar:'',utc:'',diffrenttimezone:false,usertype:1,username:''},averror:false,
          loginstatus:window.menucfg.loginstatus, forceusr:window.menucfg.forceusr,
          loading:false, courses:[],
          // 主菜单，登录后显示
          mainmenu:{
            'student':[
              {
                    'text':window.LANG.menu.dashboard,
                    'icon':'/static/img/icons8-home.svg',
                    'url' : '/student',
                    'class':'flip-float-right',
                },
                {
                    'text':window.LANG.my.settings,
                    'icon':'/static/img/icons8-settings.svg',
                    'url' : window.langPrefix+'/student/settings/profile',
                    'class':'flip-float-right',
                },
                {
                    'text' : window.LANG.menu.changeaccount,
                    'icon' : '/static/img/icons8-exchange.svg',
                    'url' : '',  
                    'click' :'showsubacc',
                    'class' : 'flip-float-right',
                },
                {
                    'class':'divider', //分割线
                },
                {
                    'text':window.LANG.menu.billing,
                    'icon':'/static/img/icons8-stack_of_money.svg',
                    'url' : window.langPrefix+'/student/payment/credits',
                    'class':'flip-float-right',
                },
                // {
                //     'text':window.menucfg.menu_orders,
                //     'icon':'/static/img/icons8-news.svg',
                //     'url' : window.menucfg.menu_orders_url,
                //     'class':'flip-float-right',
                // },
                {
                    'text':window.LANG.menu.exchange,
                    'icon':'/static/img/icons8-dollar-euro-exchange.svg',
                    'url' : window.langPrefix+'/student/payment/exchange',
                    'class':'flip-float-right',
                },
                {
                    'class':'divider',
                },
                {
                    'text':window.LANG.my.invite,
                    'icon':'/static/img/icons8-share.svg',
                    'url' : window.langPrefix+'/student/settings/invite',
                    'class':'flip-float-right',
                },
                {
                    'text':window.LANG.menu.logout,
                    'icon':'/static/img/icons8-login_rounded_right.svg',
                    'url' : '/index/index/logout',
                    'class':'flip-float-right',
                },
            ],
            'teacher':[
                {
                    'text':'设置',
                    'icon':'/static/img/icons8-settings.svg',
                    'url' : "/teacher/settings/profile",
                    'class':'flip-float-right',
                },
                {
                    'class':'divider', //分割线
                },

                {
                    'text':'邀请朋友',
                    'icon':'/static/img/icons8-share.svg',
                    'url' : "https://www.lingoba.cn/user/invite",
                    'class':'flip-float-right',
                },
                {
                    'text':'帮助中心',
                    'icon':'/static/img/icons8-help.svg',
                    'url' : "/help",
                    'class':'flip-float-right',
                },
                {
                    'class':'divider', //分割线
                },

                {
                    'text':'退出',
                    'icon':'/static/img/icons8-login_rounded_right.svg',
                    'url' : "/index/index/logout",
                    'class':'flip-float-right',
                },
            ]
          }
          }
      },
 
      mounted(){
        if(this.forceusr=='refresh')  {
            sessionStorage.removeItem('_usr');
            localStorage.removeItem('_token');
        }
        url = window.location.pathname.split('/');
        this.userload();
        this.getcurrenttime();
        
        // 从localStorage恢复未读消息计数
        try {
          const savedMsgNum = localStorage.getItem('msg_num');
          if (savedMsgNum !== null) {
            this.msg.num = parseInt(savedMsgNum, 10) || 0;
          }
        } catch(error) {
          console.error('恢复未读消息计数失败:', error);
        }
         
        Vtmp.$on('userload',re=>{
          this.userload();
        })
        Vtmp.$on('reloadnewuser', async (re)=>{
          await this.setusr();
          // location.href='/'
        })
        Vtmp.$on('stamp',re=>{
          //  console.log('stamp=',re);
           this.kstamp = re;
          //  console.log('校时完成')
        });
        Vtmp.$on('updateavatar',re=>{
           this.user.avatar = re;
           // 更新sessionStorage中的头像信息
           if(this.user) {
             sessionStorage.setItem('_usr', JSON.stringify(this.user));
           }
        });
        this.first_pop();
        setTimeout(() => {
          this.wslink();
        }, 1000);
        setTimeout(() => {
          this.sendWebSocketMessage('ping');
        }, 3000);
      },
    methods:{
       
      // 检查用户数据新鲜度
      async checkUserDataFreshness(){
        try {
          let usr = sessionStorage.getItem('_usr');
          if(usr) {
            let userData = JSON.parse(usr);
            let now = Math.floor(Date.now() / 1000);
            let last = userData.lastupdate || 0;
            
            // 如果数据超过2分钟或页面激活时强制检查，重新获取
            if(now - last > 120) {
              // console.log('页面激活检测到用户数据过期，重新获取');
              await this.setusr();
            }
          }
        } catch(error) {
          console.error('检查用户数据新鲜度失败:', error);
        }
      },
      getcurrenttime(){
          let ti = 0;
          setInterval( ()=> {
              this.kstamp = Math.floor(new Date().getTime()/1000);
              this.kstamp++;
              ti++;
              this.clock = this.timetrans(this.kstamp*1000,'time');
              Vtmp.$emit('aclock',this.clock);
              
          },1000);
      },
      getmenu(){
        return this.user.usertype==3 ?this.mainmenu.teacher : this.mainmenu.student;
      },
      bookalesson(){
        Vtmp.$emit('mycourse');
      },
      showcourse(){
        this.$refs.course.classList.toggle('open');
        this.loading = true;
        axios.post('/student/index/getmenulessons').then(re=>{
          this.loading = false;
          this.courses = re.data.data;
        })
      },
      setusr(){
        // 重新设置localStorage._usr;
        return new Promise((resolve, reject) => {
          axios.post('/index/index/getlocalstorage').then(re=>{
            let usr = re.data.usr;
            
            // 添加数据版本控制
            usr.lastupdate = Math.floor(Date.now() / 1000);
            usr.dataVersion = Date.now(); // 数据版本号
            
            // if(re.data.usr.username=='guest'){
            //   localStorage.removeItem('_usr');
            // }else{
              sessionStorage.setItem('_usr',JSON.stringify(usr));
              // localSession.setItem('_usr',JSON.stringify(usr));
              localStorage.setItem('_token',re.data.token);
            // }
            
            this.user = usr;
            // console.log('用户数据已更新，版本:', usr.dataVersion);
            resolve(usr);
            // if(usr) window.location.reload()
            // return JSON.stringify(usr);
          }).catch(error => {
            console.error('获取用户数据失败:', error);
            reject(error);
          })
        });
      },
      async userload(){
          var usr = sessionStorage.getItem('_usr');
          
          try {
            if(!usr){
              // 如果没有缓存数据，从服务器获取
              usr = await this.setusr();
            } else {
              // 解析缓存数据并检查是否需要更新
              this.user = JSON.parse(usr);
              let now = Math.floor(Date.now() / 1000);
              let last = this.user.lastupdate || 0;
              
              // 如果数据超过5分钟，重新获取
              if(now - last > 1300){
                // console.log('用户数据已过期，重新获取');
                usr = await this.setusr();
              }
            }
            
            // 确保user对象是最新的
            if(typeof usr === 'object') {
              this.user = usr;
            } else if(typeof usr === 'string') {
              this.user = JSON.parse(usr);
            }
            
          } catch(error) {
            console.error('用户数据加载失败:', error);
            // 如果出错，尝试使用缓存数据
            if(usr) {
              try {
                this.user = JSON.parse(usr);
              } catch(parseError) {
                console.error('解析缓存数据失败:', parseError);
              }
            }
          }
          
          // 设置时区信息
          var dd = new Date();
          var hour = dd.getHours();
          axios.post('/index/index/set_jstz',{hour:hour}).then(re=>{
              if(this.user) {
                this.user.diffrenttimezone = re.data.hh;
              }
              this.kstamp = re.data.stamp;
          }).catch(error => {
            console.error('设置时区失败:', error);
          });
          
          setTimeout(() => {
            this.wslink();
          }, 1000);
      }, 
      wslink(){
        // 使用SharedWorker管理WebSocket连接
        if (typeof SharedWorker !== 'undefined') {
          try {
            this.sharedWorker = new SharedWorker('/static/js/ws-shared-worker.js');
            this.ws = this.sharedWorker.port;
            // console.log('SharedWorker WebSocket端口:', this.ws);
            // 监听SharedWorker消息
            this.ws.onmessage = (event) => {
              const { type, data } = event.data;
              // console.log('SharedWorker WebSocket消息:', type, data);
              switch (type) {
                case 'ws-connected':
                  // console.log('SharedWorker WebSocket连接成功');
                  this.onWebSocketOpen(data);
                  break;
                  
                case 'ws-message':
                  // console.log('收到SharedWorker WebSocket消息:', data);
                  this.onWebSocketMessage({ data });
                  break;
                  
                case 'ws-closed':
                  // console.log('SharedWorker WebSocket连接关闭:', data);
                  this.onWebSocketClose(data);
                  break;
                  
                case 'ws-error':
                  console.error('SharedWorker WebSocket错误:', data);
                  this.onWebSocketError(data);
                  break;
                  
                case 'send-result':
                  // 发送消息结果
                  if (!data.success) {
                    console.warn('通过SharedWorker发送消息失败');
                  }
                  break;
                  
                 
                default:
                  // console.log('未处理的SharedWorker消息类型:', type);
              }
            };
            
            // 连接到WebSocket
            this.ws.postMessage({
              type: 'connect',
              data: {
                wsshost: wsshost,
                uid: this.user.username,
                wstype: 'data'
              }
            });
            
            // 启动SharedWorker端口
            this.ws.start();
            
          } catch (error) {
            console.error('SharedWorker初始化失败，回退到直接WebSocket连接:', error);
            this.fallbackToDirectWebSocket();
          }
        } else {
          console.warn('浏览器不支持SharedWorker，使用直接WebSocket连接');
          this.fallbackToDirectWebSocket();
        }
      },
      
      // 回退到直接WebSocket连接
      fallbackToDirectWebSocket() {
        this.ws = new WebSocket(wsshost+'?uid='+this.user.username+'&type=data');
        
        this.ws.onopen = (event) => {
          this.onWebSocketOpen(event);
        };
        
        this.ws.onmessage = (event) => {
          this.onWebSocketMessage(event);
        };
        
        this.ws.onclose = (event) => {
          this.onWebSocketClose(event);
        };
        
        this.ws.onerror = (event) => {
          this.onWebSocketError(event);
        };
      },
      
      // WebSocket事件处理方法
      onWebSocketOpen(event) {
        console.log('WebSocket连接已建立');
        // 这里可以添加连接成功后的处理逻辑
      },
      
      onWebSocketMessage(event) {
        // 处理心跳响应
        if (event.data === 'pong') {
          // console.log('收到心跳pong响应');
          return;
        }
        
        let obj = JSON.parse(event.data);
        this.msg.num = obj.data.msgcount;
        
        // 保存未读消息计数到localStorage
        try {
          localStorage.setItem('msg_num', this.msg.num.toString());
        } catch(error) {
          console.error('保存未读消息计数失败:', error);
        }
        
        // 这里可以添加消息处理逻辑
        // 例如：解析消息并更新UI
      },
      
      onWebSocketClose(event) {
        // console.log('WebSocket连接已关闭');
        // 这里可以添加连接关闭后的处理逻辑
      },
      
      onWebSocketError(event) {
        console.error('WebSocket连接错误:', event);
        // 这里可以添加错误处理逻辑
      },
      
      // 发送WebSocket消息的方法
      sendWebSocketMessage(message) {
        if (this.sharedWorker) {
          // 通过SharedWorker发送消息
          this.ws.postMessage({
            type: 'send',
            data: { message }
          });
        } else if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          // 直接通过WebSocket发送消息
          this.ws.send(message);
        } else {
          console.warn('WebSocket未连接，无法发送消息');
        }
      },
       
      timetrans(stamp,out=""){
         date = new Date().setTime(stamp);
         date = new Date(date);
        //  console.log(this.user);
          if(!this.user.utc){this.user.utc='Asia/Shanghai';}
          var targetTime = date.toLocaleString('zh-CN', {timeZone: this.user.utc}).split(' ');
           
          if(out == 'time'){
              return targetTime[1];
          }else{
              return targetTime[0]+' '+targetTime[1];
          }
        
      },
      getCookie(cname){
          
          var name = cname + "=";
          var ca = document.cookie.split(';');
          for(var i=0; i<ca.length; i++) 
          {
            var c = ca[i].trim();
            if (c.indexOf(name)==0) return c.substring(name.length,c.length);
          }
          return "";
        },
      checkalert(){
        let cok = decodeURIComponent(this.getCookie('_LBAUSS'));

       if(cok){ 
            ck = JSON.parse(unescape(cok));
            this.hourclock = ck.hourclock;}
            this.timezone = this.user.utc;
        axios.post('/index/index/getalert').then(re => {
            this.alert.items = re.data.data;
            this.kstamp = re.data.kstamp;
             
               Vtmp.$emit('currentTime',re.data.time);
            if(re.data.num>0){
                this.alert.num = re.data.num;
                this.alert.css="NotificationIcon--active";
            }else{
                this.alert.num = "";
                this.alert.css="";
            }
                 
                // console.log(re)
         }).catch(error => {
           console.log(error)
       });
      },
  
      avatarerror(){
        console.log('图片加载失败');
          if(this.averror) return ;
          this.averror = true;
          this.user = this.setusr();
      },
       
      clickitem(){
        if(this.msg.num>0){
            this.$refs.notices.setAttribute('class','dropdown open');
             
        }else{
            this.$refs.notices.setAttribute('class','dropdown');
        }
        
         
        
        window.open('/chat','message');
      },
      tobuy(){
          let url = window.location.pathname;
          // 取url前3个字符
          let langPrefix = url.substring(0,3);
          if(langPrefix !== '/zh' && langPrefix !== '/en') langPrefix = '';
          // 拼接带语言前缀的路径
          let targetPath = langPrefix + '/student/payment/refills';
          location.href = targetPath;
      },
      first_pop(){ //如果存在需要弹窗数据则弹窗
        
            let pop = sessionStorage.getItem('first_pop');
            // console.log(993333,pop)
            if(!pop) return false;
            let pp = JSON.parse(pop);
            setTimeout(()=>{
              if(pp.cmd=='courseoption'){
                // console.log(pp.parms,900)
                Vtmp.$emit('courseoption',pp.parms);
                sessionStorage.removeItem('first_pop');
              }
            },2000)
            
        },
      showsubacc(){
          let url = window.location.pathname;
          // 取url前3个字符
          let langPrefix = url.substring(0,3);
          if(langPrefix !== '/zh' && langPrefix !== '/en') langPrefix = '';
          // 拼接带语言前缀的路径
          let targetPath = langPrefix + '/student?show=toggleuser';
          if(url === langPrefix + '/student/index/index' || url === langPrefix + '/student') {
              Vtmp.$emit('dialog',{docmd:'toggleuser'});
          }else{
            window.location.href = targetPath;
          }
      },

    },
     
  }

  var nologin = {
    template:'#nlogin',
    data(){
      return {
      }
    },
    methods:{
      login(){
          let url = location.href;
          // if(url.indexOf('login')>0){return false;}
          Vtmp.$emit('dialog',{docmd:'login'});
      },
      signup(){
          Vtmp.$emit('dialog',{docmd:'signup'});
      }
    }

  }
  var m_menu = {
   template:'#m_menu',
   props:['showmenu'],
   data(){
      return {
        nologin : false,
        logon   : false,
        submenu: false,
        submenu2:false,
        discount:0,
        menus:{
          'student':[
                {
                    'text':window.LANG.menu.booklesson,
                    'icon':'/static/img/icons8-settings.svg',
                    'url':'',
                    'click' : 'tobook',
                    'class':'flip-float-right',
                },
                {
                    'text':window.LANG.menu.findteacher,
                    'icon':'/static/img/icons8-settings.svg',
                    'url':window.langPrefix+'/find_teachers',
                     
                    'class':'flip-float-right',
                },
                {
                    'text' : window.LANG.menu.changeaccount,
                    'icon' : '/static/img/icons8-exchange.svg',
                    'url' : "",
                    'click' :'showsubacc',
                    'class' : 'flip-float-right',
                },
                {
                    'class':'divider', //分割线
                },
                {
                    'text':window.LANG.menu.recharge,
                    'icon':'/static/img/icons8-stack_of_money.svg',
                    'url' : window.langPrefix+'/student/payment/refills',
                    'class':'flip-float-right',
                },
                // {
                //     'text':'查看账单',
                //     'icon':'/static/img/icons8-stack_of_money.svg',
                //     'url' : "{:prefix('/student/payment/credits')}",
                //     'class':'flip-float-right',
                // },
                
                {
                    'text':window.LANG.menu.exchange,
                    'icon':'/static/img/icons8-dollar-euro-exchange.svg',
                    'url' : window.langPrefix+'/student/payment/exchange',
                    'class':'flip-float-right',
                },
                {
                    'class':'divider',
                },
                {
                    'text':window.LANG.menu.invite,
                    'icon':'/static/img/icons8-share.svg',
                    'url' : window.langPrefix+'/student/settings/invite',
                    'class':'flip-float-right',
                },
                {
                    'text':window.LANG.menu.logout,
                    'icon':'/static/img/icons8-login_rounded_right.svg',
                    'url' : '/index/index/logout',
                    'class':'flip-float-right',
                },
          ],
          'teacher':[
                
                {
                    'text':'留言板',
                    'icon':'/static/img/icons8-login_rounded_right.svg',
                    'url' : "/chat",
                    'class':'flip-float-right',
                },
                {
                    'class':'divider',
                },
                {
                    'text':'课程表',
                    'icon':'/static/img/icons8-login_rounded_right.svg',
                    'url' : "/teacher/index/mybooks",
                    'class':'flip-float-right',
                },
                {
                    'text':'预留时间',
                    'icon':'/static/img/icons8-login_rounded_right.svg',
                    'url' : "/teacher/index/reserved",
                    'class':'flip-float-right',
                },
                {
                    'text':'时间发布',
                    'icon':'/static/img/icons8-login_rounded_right.svg',
                    'url' : "/teacher/index/publish",
                    'class':'flip-float-right',
                },
                {
                    'class':'divider',
                },
                {
                    'text':'更多设置',
                    'icon':'/static/img/icons8-login_rounded_right.svg',
                    'url' : "/teacher/settings/profile",
                    'class':'flip-float-right',
                },
                {
                    'text':'退出',
                    'icon':'/static/img/icons8-login_rounded_right.svg',
                    'url' : "/index/index/logout",
                    'class':'flip-float-right',
                },
          ]
        }
      }
   },
   mounted(){
    this.showm();
 
    Vtmp.$on('discount',re=>{
        this.discount = re;
    })

   },
    
    
   methods:{
      showm(){
        let ck = this.showmenu;
         
        if(ck == 'logon'){
          this.logon = true;
           this.nologin = false;
           
        }else {
           this.nologin = true;
           this.logon = false;
        }
      },
      login(){
       
        Vtmp.$emit('dialog',{docmd:'login'})
       
      },
      signup(){
        Vtmp.$emit('dialog',{docmd:'signup'})
      },
      tobook(){
        let url = '/find_teachers';
        axios.post('/student/index/getlastteacher').then(re=>{
              location.href=re.data;
          })
      },
      executeClickMethod(methodName) {
        // console.log(methodName);
        eval('this.'+methodName+'()');
      },
      showsubacc(){
        let url = window.location.pathname;
        // 取url前3个字符
        let langPrefix = url.substring(0,3);
        if(langPrefix !== '/zh' && langPrefix !== '/en') langPrefix = '';
        // 拼接带语言前缀的路径
        let targetPath = langPrefix + '/student?show=toggleuser';
        if(url === langPrefix + '/student/index/index' || url === langPrefix + '/student') {
            Vtmp.$emit('dialog',{docmd:'toggleuser'});
        }else{
          window.location.href = targetPath;
        }
      },
      getmenu(){
        let usr = JSON.parse(sessionStorage.getItem('_usr'));
        console.log(this.menus.student,729);
        return usr.usertype==3 ?this.menus.teacher : this.menus.student;
      },
      isWeixin(){ //判断是否是微信
        var ua = navigator.userAgent.toLowerCase();
        return ua.match(/MicroMessenger/i) == "micromessenger";
      },
      showsubmenu(){
         this.submenu = true;
      },
      showsubmenu2(){
         this.submenu2 = true;
      },
   },
   
}
 

var vhlogin = new Vue({
    el:'#header',
    data:{
      temp :false,
      show_m_menu: false,
      mobi:{
          is_active : "",
          LH_css  : '',
          LH_logo : "/static/img/lingoba-logo-1.svg",
          mmenu : '',
      },
      nologin : false,
      logon   : window.menucfg.loginstatus,
      notteacher: true,
      items:{},
      discount:0, 

    },
    components:{
      'loginhead':loginhead,
      'nologin' : nologin,
      'mobilemenu' : m_menu
    },
    created(){
      // this.menu();
    },

    mounted(){

      url = window.location.pathname;
      if(url.indexOf('teacher')!=-1){
        this.notteacher = false;
      }else{
        this.notteacher = true;
      }
      // this.getmenus();
      this.getloginstatus(); 
	  Vtmp.$on('discount',re=>{this.discount=re})
    },
    methods:{
      getloginstatus(){
        axios.post('/index/index/getloginstatus').then(re=>{
           if(re.data){
              this.logon = true;
              sessionStorage.setItem('loginstatus',1);
           }else{
              this.logon = false;
              sessionStorage.setItem('loginstatus',0);
           }
        })
      },
        
       mobile_menu(){
        let act = this.mobi.is_active;
        
        if(act == 'is_active'){
         act = '';
        }else{
          act = 'is_active';
        }
        this.mobi.is_active = act;
        
        if(act != 'is_active'){
          this.mobi.LH_css = "";
          this.mobi.is_active = "";
          this.mobi.LH_logo = window.menucfg.logo_normal;
          this.mobi.mmenu = '';
          this.show_m_menu = false;
          _$('body').removeClass('hide-scroll');
       }else{
          this.mobi.LH_css = "LandingHeader--sticky LandingHeader--snapped LandingHeader--hamburger-open LandingHeader--inverted-colors";
          this.mobi.is_active = "is_active";
          this.mobi.LH_logo = window.menucfg.logo_white;
          this.mobi.mmenu = this.logon ? 'logon' : 'nologin';
          this.show_m_menu = true;
          _$('body').addClass('hide-scroll');
          this.$forceUpdate();
          // console.log(this.mobi,222222222);
       }
        // return act;
        // console.log(this.mobi.is_active,'hll');  
       },
       
    },
    watch:{
      mobile_menu(newv,oldv){
        // console.log(newv,oldv+'999');
        
      }
    }
  })
 
 