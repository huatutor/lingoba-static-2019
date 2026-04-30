var teachersearch = ({
  template:'#tmp_smenu',

  data(){return{keys:{key:[],val:[]},parms:{ time:[],gender:[],other:[],search:[],ltype:[],speak:[]},
            ck:'',kmplace:LANG.index.chinese,
            subtitle:LANG.teacher.subtitle,
            km:{},subkm:false, aicheck:false, aiprompt:'', aibtn:false,
            kmlist:[
                {label:LANG.index.chinese,val:'Chinese',flag:'/static/flags/1x1/cn.svg'},
                // {label:LANG.index.math,val:'Math',flag:'/static/img/icons8-math.svg'},
                // {label:LANG.index.english,val:'English',flag:'/static/flags/1x1/us.svg'},
              ],
            orderby:'',keyword:'' }},
      created(){
        let _kemu = JSON.parse(localStorage.getItem('_kemu'));
        if(!_kemu){_kemu = {val:'Chinese',label:LANG.index.chinese,flag:'/static/flags/1x1/cn.svg'}}
        this.km = _kemu;
        // this.$forceUpdate();
        setTimeout(()=>{
          Vtmp.$emit('changekemu',this.km);
        },200)
        
     
      },
    mounted(){ 
      if(localStorage.aiprompt){
         setTimeout(()=>{
          this.aiprompt =  localStorage.aiprompt; 
        },400)
         
      }
      Vtmp.$on('orderby',re=>{
          this.orderby = re;
          this.search();
      })
      Vtmp.$on('setkemu',re=>{
        this.kmselect(re);
      })
      Vtmp.$on('aisearchend',re=>{
        this.aibtn = false;
        if(re=='hide'){
          this.aicheck = false;
        }
      })
      Vtmp.$on('aibtn',re=>{
        this.aibtn = re;
      })

        var _this = this;
      Vtmp.$on('menuclick',re=>{
        this.aicheck = false;
        //判断是否已经存在
        let index = _this.keys.key.indexOf(re.idx);
        switch (re.tag){
            
            case 'search':
              
              this.removex(re);
              this.add(re);
              // console.log(4,this.keys)
              break;
        
            default:
              if(index == -1){
                this.add(re);
              }else{
                this.removex(re);
              }
              break;
        }
      
        this.search();
        // console.log(_this.keys,_this.parms);
      })

     
  },
  methods:{
    showkemu(){
      this.subkm = !this.subkm;
      if (this.subkm) {
        // 添加全局点击事件监听
        document.addEventListener('click', this.handleClickOutside);
      } else {
        // 移除全局点击事件监听
        document.removeEventListener('click', this.handleClickOutside);
      }
    },
    kmselect(km){
      console.log(km);
      if(typeof km === 'string'){
        km = this.findItemByVal(km);
      }
      this.km=km;
      this.subkm = false;
      document.removeEventListener('click', this.handleClickOutside);
      localStorage.setItem('_kemu',JSON.stringify(km));
      Vtmp.$emit('changekemu',km);
      // 将 km 写入到 Cookie
      const cookieName = 'selected_km'; // 定义 Cookie 的名称
      const cookieValue = JSON.stringify(km); // 将 km 转换为字符串
      const cookieMaxAge = 86400*365; // Cookie 的有效期，单位为秒（例如 3600 秒，即 1 小时）
      const cookiePath = '/'; // Cookie 的路径，通常设置为根路径

      // 设置 Cookie
      document.cookie = `${cookieName}=${encodeURIComponent(cookieValue)}; max-age=${cookieMaxAge}; path=${cookiePath}`;
      history.pushState(null, null, '?km='+km.val);
      // this.km = km.val;
      this.parms.km = km.val;
      this.search();
    },
    findItemByVal(inputVal) {
        // 遍历 kmlist 数组
        for (let i = 0; i < this.kmlist.length; i++) {
            // 比较当前项的 val 属性和输入的 val 值，不区分大小写
            if (this.kmlist[i].val.toLowerCase() === inputVal.toLowerCase()) {
                return this.kmlist[i];
            }
        }
        // 如果没有找到匹配项，返回 null
        return null;
    },
    handleClickOutside(event) {
      // 检查点击是否发生在菜单外部
      if (this.$refs.kemu && !this.$refs.kemu.contains(event.target)) {
        this.subkm = false;
        document.removeEventListener('click', this.handleClickOutside);
      }
    },
    tosearch(){
      if(this.keyword=='') {
        this.removex({tag:'search'});
        this.search();
        return false;}
      let sk = this.parms.search;
      if(sk.indexOf(this.keyword)==-1){
        Vtmp.$emit('menuclick',{tag:'search',text:this.keyword,idx:'key'});
        return;
      }
      this.search();
    },
    add(re) {
        // 如果 re.tag 是 'search'
        if (re.tag === 'search') {
            const searchValue = this.parms.search.length > 0 ? this.parms.search[0] : null;
            this.parms.search =  [];
            this.parms.search.unshift(re.text);
            this.keys.key.unshift(re.idx);
            this.keys.val.unshift(re.text);
            if (searchValue !== null) {
                // 找到 this.keys.val 中等于 searchValue 的索引
                const index = this.keys.val.indexOf(searchValue);
                if (index !== -1) {
                    // 移除 this.keys.val 和 this.keys.key 中对应索引的值
                    this.keys.val.splice(index, 1);
                    this.keys.key.splice(index, 1);
                }
            }
        } else {
            // 非 'search' 的情况，保持原有逻辑
            this.keys.key.unshift(re.idx);
            this.keys.val.unshift(re.text);
            this.parms[re.tag] = this.parms[re.tag] || [];
            this.parms[re.tag].unshift(re.idx);
        }
    },

    removex(re) {
        if (re.tag === 'search') {
            // 查找并移除 search 相关的数据
            const index = this.keys.key.findIndex((key, i) => key === re.idx && this.keys.val[i] === re.text);
            if (index !== -1) {
                this.keys.key.splice(index, 1); // 移除 key
                this.keys.val.splice(index, 1); // 移除 val
                this.parms[re.tag].shift(); // 移除 search 的第一项
            }
        } else {
            // 移除非 search 相关的数据
            const index = this.keys.key.indexOf(re.idx);
            if (index !== -1) {
                this.keys.key.splice(index, 1); // 移除 key
                this.keys.val.splice(index, 1); // 移除 val
                const parmIndex = this.parms[re.tag].indexOf(re.idx);
                if (parmIndex !== -1) {
                    this.parms[re.tag].splice(parmIndex, 1); // 移除 parms 中的对应项
                }
            }
        }
    },
    search(){
      this.aicheck = false;
      this.parms.orderby = this.orderby;
      Vtmp.$emit('searchParms',this.parms);
    },
    showmenu(cat){
        let obj = "this.$refs."+cat;
        obj = eval(obj);
        let objRect = obj.getBoundingClientRect();
        // console.log(obj,obj.getBoundingClientRect(),991);
        var left,top;
        left = objRect.left;
            // 获取searchbar相对于文档顶部的位置
        top = objRect.top + window.scrollY;
        // 计算菜单应该显示的位置（在searchbar下方）
        let menuTop = top + obj.offsetHeight +18; 
            
          let w = obj.clientWidth;
          // left = (left + w/2);
          left = left - 50;
          // console.log(left,top,menuTop, 318);
         
        let res = {
           id:cat,
           left:left,
           top:menuTop,
           parms:this.parms
        }
        Vtmp.$emit('showm',res);
    },
    remove(idx) {
          // 获取要移除的值
          const vv = this.keys.key[idx];
          // 移除 keys 中的对应项
          this.keys.key.splice(idx, 1);
          this.keys.val.splice(idx, 1);
          console.log(vv,8771)
          Vtmp.$emit('removeso',vv);
          // 处理 search 标签的特殊逻辑
          if (vv === 'key') {
              this.parms.search.shift(); // 移除 search 的第一项
              this.search();
              return;
          }

          // 更新 parms 中的数据
          for (const ct in this.parms) {
              const ix = this.parms[ct].indexOf(vv);
              if (ix !== -1) {
                  this.parms[ct].splice(ix, 1);
              }
          }

          // 调用 search 方法
          this.search();
      },
    clear(){
      this.keys.key = [];
      this.keys.val = [];
      this.parms = {time:[],gender:[],other:[],search:[],ltype:[],speak:[]};
      Vtmp.$emit('removeso','all');
      this.search();
    },
    mobilesch(){
      Vtmp.$emit('mobilesch');
    },
    aiclick(){
      this.aicheck = !this.aicheck;
      
    },
    aisearch(){
      this.keys = {key:[],val:[]}
      this.aiprompt = this.aiprompt.trim();
      if(this.aiprompt =='') return ;
      this.aibtn = true;
      Vtmp.$emit('aisearch',this.aiprompt);
      return false;
    },
    

  },
  beforeDestroy() {
    // 组件销毁前移除事件监听
    document.removeEventListener('click', this.handleClickOutside);
  },
  watch:{
    // parms:{
    //   handler(a,b){
    //     clearTimeout(this.ck);
    //     this.ck = setTimeout(()=>{
    //        Vtmp.$emit('searchParms',this.parms);
    //     },500);
    //   },
    //   deep: true
    // }
  }
})

var teacherlist = {
    template:'#tmp_teacher',
    data(){return{items:{},top:0,loading:'',page:'',pages:{pg:1,page:1},
            len:0,ck:0,showloading:true,loginstatus:loginstatus,detail:{},search:{},
            km:'',   showDetailTimer:false,  tk:0, aiquery:0,
            isscroll:false,qrcode:'',usr:{}}
          },
    mounted(){
       this.loading  = '<div class="CenteredSpinner flex flex-1 flex-align-center flex-justify-content-center margin-xl"><div class="LoadingSpinner"></div></div>';
       if(_geturlvv('km')){
          this.km = _geturlvv('km');
          Vtmp.$emit('setkemu',this.km);
       }
       this.getteacher();
       // 新增实时滚动处理，用于固定 searchbar
        window.addEventListener('scroll', this.handleSearchbarFixed);
       // 使用节流后的函数监听滚动
       this._throttledScroll = this.throttle(this.getScroll, 300); // 每 300ms 最多执行一次
       window.addEventListener('scroll', this._throttledScroll);
       Vtmp.$on('searchParms',re=>{
          this.aiquery = 0;
          this.page = 1;
          this.search = re;
          if(this.search.km) {
            this.km = re.km;
          }
          this.getteacher();
          // 滚动条回到顶部
          window.scrollTo({ top: 0, behavior: 'smooth' });
              this.top = 0;
          setTimeout(() => {
              this.showdetailx();
          }, 500);
            
       })
       
       Vtmp.$on('aisearch',re=>{
          localStorage.setItem('aiprompt',re,30*1440);
           
          // 滚动条回到顶部
          window.scrollTo({ top: 0, behavior: 'smooth' });
              this.top = 0;
              this.showdetailx();
              this.showloading = true;
              this.items = [];
              Vtmp.$emit('hiddenDetail',1);
              
          axios.post('/index/index/aipick',{prompt:re}).then(re=>{ 
            clearInterval(this.tk);
            this.aiquery = 1;
              this.items = re.data.list;
              this.usr = re.data.usr;
              this.pages = re.data.pages;
              this.$forceUpdate();
              this.showloading = false;
              Vtmp.$emit('aisearchend');
          })
       })
    },
    methods:{
      showdetailx(){
        let first;
            if(this.items.length>0){
              first = this.items[0].username;
              // console.log(first,7711)
              Vtmp.$emit('hiddenDetail',false);
              setTimeout(()=>{
                Vtmp.$emit('s_detail',this.items[0]);
              },1000)
              // this.getwelfare();
              this.getlike();
            }else{
              Vtmp.$emit('hiddenDetail',true);
            }
        // this.loginstatus = re.data.pages.login;
        if(this.top ==0){
            setTimeout(() => {
              Vtmp.$emit('xtop',{top:this.top,vo:this.items[0]});
            }, 500);
            
        }
      },
      getaipick(append=false){
        axios.post('/index/index/getaipick',{page:this.page}).then(re=>{
            if(re.data.code=='999'){
              clearInterval(this.tk);
              Vtmp.$emit('dialog',{docmd:'login'});
              return;
            }
          if(re.data.usr){
            if (append) {
                  this.items = this.items.concat(re.data.list); // ✅ 追加新数据
                } else {
                  this.items = re.data.list;
                  
                }
                Vtmp.$emit('aisearchend');
            this.usr = re.data.usr;
            this.pages = re.data.pages;
            this.$forceUpdate();
            this.showloading = false;
            this.showdetailx();
            clearInterval(this.tk);
          }
        })
      },
      getteacher(append=false){
          
          this.showloading = true;
          let _parms={page:this.page,search:this.search,km:this.km};
          this.$emit('seolist',false); //关闭前端显示
          
          axios.post('/index/index/getteacher3',_parms).then(re=>{
              this.showloading = false;

                if (append) {
                  this.items = this.items.concat(re.data.list); // ✅ 追加新数据
                } else {
                  this.items = re.data.list;
                }
                this.pages = re.data.pages;
                this.usr = re.data.usr;
              //  this.getfreeset();

                let first;
                if(this.items.length>0){
                  first = this.items[0].username;
                  // console.log(first,7711)
                  Vtmp.$emit('hiddenDetail',false);
                  setTimeout(()=>{
                    Vtmp.$emit('s_detail',this.items[0]);
                  },1000)
                  // this.getwelfare();
                  this.getlike();
                }else{
                  Vtmp.$emit('hiddenDetail',true);
                }

            // this.loginstatus = re.data.pages.login;
            if(this.top ==0){
                Vtmp.$emit('xtop',{top:this.top,username:first});
            }
            
          })
      },
      throttle(func, delay) {
        let timer = null;
        return function (...args) {
          if (!timer) {
            timer = setTimeout(() => {
              func.apply(this, args);
              timer = null;
            }, delay);
          }
        };
      },
      getfreeset(){
        if(!this.usr) return false;
        axios.post('/index/index/getfreeset',{usr:this.usr}).then(re=>{
            let fset = re.data;
            for(ix in this.items){
              let uid = this.items[ix].username;
              if(fset[uid]){
                  this.items[ix].freeset = fset[uid];
              }else{
                  this.items[ix].freeset = 0;
              }
            }
            this.$forceUpdate();
        })
      },
      dofav(idx){
          let _this = this;
          let uid  = this.items[idx].username;
          let isfav = this.items[idx].isfav;
          // console.log(this.items[idx],191);
          axios.post('/index/index/joinfavorite',{u:uid}).then(re=>{
            if(re.data.login=='no'){
              Vtmp.$emit('showannc',{"msg":LANG.teacher.loginfirst,'status':'error'});
              return ;
            }
            _this.items[idx].isfav = !isfav;
            var m = re.data.fav ? LANG.teacher.followed:LANG.teacher.cancelfollowed;
            const st = re.data.fav ? 'ok':'error';
            Vtmp.$emit('showannc',{"msg":m,'status':st});
            // 更新 follows 数组
            this.updatefav(uid,re.data.fav);
          })
      },
      updatefav(uid, isfav) {
          // 从 sessionStorage 读取当前 follows 数组
          let follows = sessionStorage.getItem('_follows');
          follows = follows ? JSON.parse(follows) : [];

          // 根据 isfav 决定插入或移除
          const idx = follows.indexOf(uid);
          if (isfav) {
            // 关注：若不存在则添加
            if (idx === -1) follows.push(uid);
          } else {
            // 取消关注：若存在则移除
            if (idx !== -1) follows.splice(idx, 1);
          }

          // 写回 sessionStorage
          sessionStorage.setItem('_follows', JSON.stringify(follows));
      },
      ilike(idx){
        
        let uid  = this.items[idx].username;
        var likes = sessionStorage.getItem('_favs');
        if(likes){
          likes = JSON.parse(likes);
          for(ix in likes){
            if(uid==likes[ix]){ //以点赞
              return false;
            }
          }
        }else{
          likes = new Array();
        }
        
        axios.post('/index/index/dolike',{tname:uid}).then(re=>{
          likes.push(uid);
          sessionStorage.setItem('_favs',JSON.stringify(likes));
          this.items[idx].ilike++;
          this.getlike();
        })
      },
      copyurl(idx){
          // console.log(this.items[idx])
          // let tname = this.items[idx].uuid;
          let url = 'https://'+location.host+'/share?spm='+this.items[idx].spm;
          // console.log('url',url);
          this.copy(url);
          Vtmp.$emit('showannc',{status:'ok',msg:LANG.teacher.copied});
          return false;
          
          // this.$refs.search.value = pwd;
          // this.$refs.iurl.blur();
      },
      copy(data){
          let url = data;
          // 使用现代 Clipboard API 复制文本
          if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(url).then(() => {
              // 复制成功
            }).catch(err => {
              console.error('复制失败:', err);
            });
          } else{
            alert('浏览器不支持，请手动复制');
          }
      },
      getlike(){
        var likes = sessionStorage.getItem('_favs');
        if(likes){
          likes = JSON.parse(likes);
          for(ix in likes){
            for(vx in this.items){
              if(this.items[vx].username ==likes[ix]){
                this.items[vx].ilikeflag = true;
              }
            }
          }
          this.$forceUpdate();
        }
        var follows = sessionStorage.getItem('_follows');
        if(follows){
          follows = JSON.parse(follows);
          for(ix in follows){
            for(vx in this.items){
              if(this.items[vx].username ==follows[ix]){
                this.items[vx].isfav = true;
              }
            }
          }
          this.$forceUpdate();
        }else{
          axios.post('/index/index/getfollows').then(re=>{
            if(re.data.login=='no') return;
            follows = re.data;
            sessionStorage.setItem('_follows',JSON.stringify(follows));
            for(vx in this.items){
              if(follows.includes(this.items[vx].username)){
                this.items[vx].isfav = true;
              }
            }
            this.$forceUpdate();
          })
        }
      },
      
      getScroll(){
         this.page = this.page=='' ? this.pages.page : this.page;
         if(this.pages.pg <= this.page) return;

        let scrollTop = window.scrollY || document.documentElement.scrollTop;
        let clientHeight = document.documentElement.clientHeight;
        let scrollHeight = document.documentElement.scrollHeight;
        
          // ✅ 只在向下滚动时触发
        if(scrollTop > this.lastScrollTop){
          if(scrollTop + clientHeight + 600 >= scrollHeight){
            this.page++;
            if(this.aiquery){
              // console.log('getaipick',416);
              this.getaipick(true);
            }else{
              this.getteacher(true); // 加载下一页
            }
            
          }
        }
        this.lastScrollTop = scrollTop; // 更新上次滚动位置

      },
      handleSearchbarFixed() {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const searchbar = document.getElementById('searchbar');
        if (!searchbar) return;

        // 判断临界值：桌面 350px，移动 305px
        const threshold = window.innerWidth <= 768 ? 305 : 350;

        if (scrollTop >= threshold) {
          searchbar.classList.add('fixed-bar');
        } else {
          searchbar.classList.remove('fixed-bar');
        }
      },
      bookpop(uid){
          let ltype='free';
          Vtmp.$emit('dialog',{docmd:'popbooks',tname:uid,title:LANG.teacher.book_course,type:ltype});
          
      },
      showcourse(vx){
              Vtmp.$emit('selectcourse',{tname:vx.tname,from:'teacher'});
            } ,
      directbook(vx){
        // console.log(vx);
        Vtmp.$emit('directbook',{tname:vx.tname,id:0});
      },
      hover(e,vo){
        // console.log(e)
        this.top = e.srcElement.offsetTop;
        Vtmp.$emit('xtop',{top:this.top,vo:vo});
      },
      jump(tname){
        location.href=window.langPrefix+"/teachers/"+tname;
      },
      sendmsg(user){
        localStorage.setItem('chat',user);
        window.open('/chat','message');
      },
      getwelfare(){
          let vo = new Array();
          for(ix in this.items){
              vo.push(this.items[ix].username);
          }
          axios.post('/index/index/checkwelfare',{vo:vo}).then(re=>{
            let user;
             for(ix in this.items){
                user = this.items[ix].username;
                this.items[ix].welfare = re.data[user] ? true : false;
             }
          })
        
        },
      clickpage(n){
        this.page = n;
        this.top = 0;
        this.getteacher();

      },
      showqrcode(idx){
        clearTimeout(this.ck) ;
        this.items[idx].qrcodecss = 'open';
        if(this.items[idx].qrcode) {
          this.$forceUpdate();return;
        } ;
        let _this = this;
        let vv = this.items[idx];
        axios.post('/index/index/getteacherqrcode',{vo:vv}).then(re=>{
          _this.items[idx].qrcode =  re.data;
          _this.$forceUpdate();
        })
      },
      hideqrcode(){
        this.ck = setTimeout(()=>{
          for(ix in this.items){
              this.items[ix].qrcodecss = "";
          }
          this.$forceUpdate();
        },200)
          
       },
    },
    watch: {
      showloading(newValue, oldValue) {
        if (newValue !== oldValue) {
          Vtmp.$emit('showloading',newValue);
        }
      }
    },
    beforeDestroy() {
      window.removeEventListener('scroll', this._throttledScroll);
    },
 }

 var teacherdetails = {
  template:'#tmp_detail',
  data(){return{top:1,uuid:'',td:{},size:12,show:false, info:{},stamp:{},yb:{cover:'',iframe:'',play:'<i class="fa fa-play"></i>'}}},
  computed: {
    sliderStyle() {
      const windowHeight = window.innerHeight;
      const maxTop = document.documentElement.scrollHeight - windowHeight - 300; // 距离底部300px
      const currentTop = Math.min(this.top, maxTop);
      return {
        transform: `translateY(${currentTop}px)`
      };
    }
  },
  mounted(){
     Vtmp.$on('xtop',re=>{
        if(this.top != re.top){
           this.top = re.top;
           this.td = re.vo;
           this.showdetail()
        }
     })
    Vtmp.$on('hiddenDetail',re=>{
        this.show = re ? false: true ;
    });
    Vtmp.$on('s_detail',re=>{
      this.td = re;
      this.showdetail();
    })
  },
  methods:{
    showdetail() {
        this.yb = {cover:'',iframe:'',play:'<i class="fa fa-play"></i>'};   
        if (this.td === undefined) {
          setTimeout(() => {
            this.showdetail();
          }, 1000);
          return;
        }
        let tname = this.td.tname;
         this.yb.cover = this.td.vdata.cover;
         this.yb.iframe = this.td.vdata.iframe;
         this.yb.play = '<i class="fa fa-play"></i>';
         this.info.utc = this.td.utc;
         this.info.url = window.langPrefix+"/teachers/"+tname;
        // 从localStorage中获取teacher_cache
        let teacherCache = localStorage.getItem('teacher_cache');

        // 如果teacher_cache存在，解析为对象
        if (teacherCache) {
            teacherCache = JSON.parse(teacherCache);
        } else {
            // 如果teacher_cache不存在，初始化为空对象
            teacherCache = {};
        }
        // 检查teacher_cache中是否存在当前tname的数据
        if (teacherCache[tname]) {
            // 如果缓存命中，直接使用缓存数据
            let data = teacherCache[tname];
            this.show = true;
            this.stamp = data.stamp;
            // this.info = data.info;
            
        } else {
            // 如果缓存中不存在，从服务器获取数据
            axios.post('/index/index/getdetails', { tname: tname })
                .then(re => {
                    console.log('获取详情数据成功:', re.data);
                    this.show = true;
                    this.stamp = re.data.stamp;
                   
                    // 将获取到的数据写入teacher_cache
                    teacherCache[tname] = re.data;
                    localStorage.setItem('teacher_cache', JSON.stringify(teacherCache));
                })
                .catch(error => {
                    console.log('Error fetching detail data:', error);
                });
        }
    },
    play(){
      this.yb.play = this.yb.iframe;
    },
  },
}

 var v_tls = new Vue({
    el:'.FlexContent',
    data:{menucss:'',orderby:'magic',km:{label:'中文',val:'Chinese'},seolist:true,loading:false},
    components:{
      'teachersearch':teachersearch,
      'teacherlist':teacherlist,
      'teacherdetails':teacherdetails
    },
    mounted(){
      Vtmp.$on('menuclass',re=>{
          this.menucss = re == 'clear' ?'':'TeacherListing--transparent';
      })
      Vtmp.$on('changekemu',re=>{
        this.km = re;
      })
      Vtmp.$on('showloading',re=>{
        this.loading = re;
      })
       
    },
    methods:{
      closemenu(){

         if(this.menucss){
            let sm = v_smenu.show;
            for(ix in sm){
              sm[ix] = false;
            }
            this.menucss="";
         }
         
      },
      handleSeolistChange(newValue) {
            this.seolist = newValue;
            // console.log('seolist 更新为:', this.seolist);
        }
    },
    watch:{
      orderby(a,b){
          Vtmp.$emit('orderby',a);
      }
    }
  })


 