 
  // var login = sessionStorage.getItem('loginstatus');
  // 全局可用
window.switchModal = function (current, next, options = {}) {
  // 先解绑，避免多次绑定触发多次
  $(current).off('hidden.bs.modal').on('hidden.bs.modal', function () {
    $(next).modal(Object.assign({ backdrop: 'static', show: true }, options));
  });

  $(current).modal('hide');
}; 
// 课程详情
  var VcourseDetail = new Vue({
    el:'#coursedetail',
    data:{vo:{},ps:{},btn:{label:LANG.dialog.book_lesson,todo:'book'},backbtn:{label:LANG.dialog.close ,todo:'close'},
            teacher:{}, buy:true,balance:0,//剩余课时数,
            topicid:'', allowcheck:true,
            info:''
             }, 
    mounted(){
      // 激活课程显示模态窗 re={id:id,btn:['edit','book']}
      Vtmp.$on('coursedetail',re=>{
        // console.log(re,9999);
        $('#coursedetail').modal('show');
        
        this.getcourse(re.id);
        this.btn.todo = re.btn;
        this.btn.label = LANG.dialog.purchase_lesson;
        if(re.btn=='edit'){
           this.btn.label = LANG.dialog.edit;
        }
        
        // this.btn.label = re.btn=='edit'?'编辑':'预定课程';
        if(re.ref=='selectcourse'){
            this.backbtn = {label:LANG.dialog.back,todo:'selectcourse'}
        }
        hidescroll();
        // console.log(this.btn);
        $("#coursedetail").on('hide.bs.modal', () =>{
          showscroll();
        })
      })
      
    },
    methods:{
      getcourse(id){
        axios.post('/index/index/get_course_detail',{id:id}).then(re=>{
            this.vo = re.data;
            this.getprice();
            this.checkbuy();
        })
      },
      checkbuy(){
          if(this.allowcheck){
            this.allowcheck = false;
            axios.post('/index/index/check_buy',{courseid:this.vo.id}).then(re=>{
              // console.log(re.data,9888);
              this.buy = re.data.buy;
              this.balance = re.data.balance;
              this.info = re.data.msg
              if(re.data.cpid){
                  this.vo.cpid = re.data.cpid;
              }
            })
            setTimeout(()=>{
              this.allowcheck = true;
            },2000)
          }
          
      },
      getprice(){
        axios.post('/index/index/get_topic_price',{topicid:this.vo.id}).then(re=>{
            this.ps = re.data.group;
            this.teacher = re.data.teacher;
            // console.log(this.ps)
        })
      },
      backtodo(){
         if(this.backbtn.todo=='selectcourse'){
           
          Vtmp.$emit('selectcourse',{id:this.vo.id,tname:this.vo.tname,from:'aaa'});
           
          $('#coursedetail').modal('hide');
         }else{
          $('#coursedetail').modal('hide');
         }
      },
      tonext1(){
        if(this.btn.todo=='edit'){
          // 编辑课程
          if(this.vo.lessionstyle==3){
            window.location.href= '/teacher/index/newtopic?topicid='+this.vo.id;
            return;
          }else{
            Vtmp.$emit('lessondata',this.vo);
            $('#coursedetail').modal('hide');
            $('#editlesson').modal('show');
            
          }
        }else{
          // 预定课程
          let obj = this.vo;
          // obj.courseid = obj.id;
          // delete obj.id;
          let parms  = {tname:this.vo.tname,cpid:this.vo.cpid}
          this.teacher.username = this.teacher.tname;
          obj.teacher = this.teacher;
          Vtmp.$emit('bookcourse',parms);
          $('#coursedetail').modal('hide');
        }
      },
      tobuy(){
        Vtmp.$emit('courseoption',{id:this.vo.id});
        $('#coursedetail').modal('hide');
      }
    },
    beforeDestroy() {
      Vtmp.$emit('reload');
    }
  })
// 选择课程
  var Vselect = new Vue({
    el:'#selectcourse',
    data:{ items:{}, vo:{tname:'',id:'',prev:''},paid:{showbtn:false},teacher:{},
          bought:{},free:true,trial:0  ,btn:{},back:false
        },
    mounted(){
      Vtmp.$on('selectcourse',re=>{
        this.back = re.btn=='close';
        $('#selectcourse').modal({backdrop: 'static',show: true});
          this.vo = re;
          if(this.vo.id==undefined){
            this.vo.id = '0';
            setTimeout(() => {
              this.getbtn();
            }, 300);
            
          }
          const ele = document.querySelectorAll('.coursex');
          ele.forEach(element => {
                  element.classList.remove('coursex-active');
                  // 检查元素的data-id属性是否等于this.vo.id
                if (element.getAttribute('data-id') == this.vo.id) {
                    element.classList.add('coursex-active');
                }
              });
              if(this.vo.id || this.vo.id === '0'){
                this.getvalidcourse(this.vo.id);
              }
        
        this.loadcourse();
        hidescroll();
        $("#selectcourse").on('hide.bs.modal', () =>{
          //  console.log(this.vo,999);
             this.paid = {showbtn:false};
             showscroll();
        });
        
      })
      
    },
    methods:{
      loadcourse(){
        axios.post('/index/index/get_teacher_couses',{tname:this.vo.tname}).then(re=>{
            this.items = re.data.data;
            this.teacher = re.data.teacher;
            this.getpuchased();
            this.getcoursebytname();
        })
      },
      selectcourse( ) {
          const ele = document.querySelectorAll('.coursex');
          ele.forEach(element => {
              element.classList.remove('coursex-active');
          });
           
              // 给被点击的元素添加coursex-active样式
              event.currentTarget.classList.add('coursex-active');
              // 将被点击元素的 data-id 值赋值给 this.vo.id
              this.vo.id = event.currentTarget.getAttribute('data-id');
          // let ix = this.buy(this.vo.id);
          this.getbtn();
          // this.getvalidcourse(this.vo.id);
          this.$forceUpdate();
      },
      getpuchased(){
        axios.post('/index/index/get_my_couses',{tname:this.vo.tname}).then(re=>{
          
          if(re.data.result==0){
            this.bought = [];
            return ;
          }
          const boughtMap = re.data.data;

          this.items.forEach(item => {
            const buy = boughtMap[item.id];
            if (buy) Object.assign(item, buy);
          });
          this.$forceUpdate();
        })
      },
      mycourse(){
        // window.location.href = '/student/index/courses';
        $('#selectcourse').modal('hide');
         
          Vtmp.$emit('mycourse');
      
        
      },
      getcoursebytname(){
        axios.post('/index/index/getcoursebytname',{tname:this.vo.tname}).then(re=>{
            // this.bought = re.data.data;
            this.free = re.data.free;
            this.trial = re.data.trial;
            // let ix = this.buy(this.vo.id);
        })
      },
      isIdInBought(id) {
        // 检查 this.bought 是否已定义且为数组
        if (!Array.isArray(this.bought)) {
          return false; // 如果 this.bought 不是数组，返回 false
        }

        // 使用 Array.prototype.filter 方法找到所有匹配的项
        const matchedItems = this.bought.filter(item => item.courseid == id);

        // 如果没有匹配项，返回 false
        if (matchedItems.length === 0) {
          return false;
        }

        // 找到第一个 item.balance != 0 的项
        const validItem = matchedItems.find(item => item.balance != 0);

        // 如果找到有效的项，返回该项；否则返回 false
        return validItem !== undefined ? validItem : false;
      },
      getbtn(){
        let ele = document.querySelector('.coursex-active');
        let id = ele.getAttribute('data-id');
        let buy = this.isIdInBought(id);
        let vx = this.items.find(item => item.id == id);
         
        this.btn = {};

        const getButtonConfig = (label, action, show) => ({ label, do: action, show });

        const handleLessonStyle = (style, balance) => {
          switch (style) {
            case 2:
              return balance > 0
                ? getButtonConfig(LANG.dialog.book_trial_lesson, 'bookcourse', true)
                : getButtonConfig(LANG.dialog.cannot_book_trial_again, 'none', false);
            case 4:
              return balance > 0
                ? getButtonConfig(LANG.dialog.book_free_lesson, 'bookcourse', true)
                : getButtonConfig(LANG.dialog.cannot_book_free_again, 'none', false);
            default:
              return balance > 0
                ? getButtonConfig(LANG.dialog.lesson_booking, 'bookcourse', true)
                : getButtonConfig(LANG.dialog.next_step, 'next', true);
          }
        };

        if (buy) {
          this.btn = handleLessonStyle(vx.lessionstyle, buy.balance);
        } else {
          if (vx.lessionstyle === 2) {
            this.btn = this.trial
              ? getButtonConfig(LANG.dialog.next_step, 'next', true)
              : getButtonConfig(LANG.dialog.cannot_purchase, 'none', false);
          } else if (vx.lessionstyle === 4) {
            this.btn = this.free
              ? getButtonConfig(LANG.dialog.next_step, 'next', true)
              : getButtonConfig(LANG.dialog.cannot_purchase_again, 'none', false);
          } else {
            this.btn = getButtonConfig(LANG.dialog.next_step, 'next', true);
          }
        }
        if(vx.id === '0'){
           this.btn = getButtonConfig(LANG.dialog.lesson_booking, 'bookcourse', true);
        }
        // console.log(this.btn,vx.id,8880)
        
      },
      handleDynamicClick() {
          if (typeof this[this.btn.do] === 'function') {
            console.log(this.btn,693)
            this[this.btn.do]();
          } else {
            console.log('未知操作');
          }
        },
      none(){
        console.log('none')
      },
       
      getbuy(){
        let ele = document.querySelector('.coursex-active');
        let id = ele.getAttribute('data-id');
        return this.isIdInBought(id);
      },
       
      getvalidcourse(id){
          if(!sessionStorage.getItem('loginstatus')){
              return;
          }
          if(id==='0'){
                this.paid = {showbtn:true};
                return ;
          }
          axios.post('/student/index/getvalidcourse',{cid:id}).then(re=>{
              // this.vo = re.data;
              // console.log(re.data,991122)
              if(re.data!==0){
                this.paid =re.data;
                this.paid.showbtn = true;
                this.paid.balance = this.paid.qty - this.paid.used - this.paid.booking;
              }else{
                this.paid = {showbtn:false};
              }
              
              // this.vo.balance = re.data.qty - re.data.used - re.data.booking;
          })
      }, 
      showdetail(vx){
        vx.ref = 'selectcourse';
        
        $('#selectcourse').modal('hide');
        Vtmp.$emit('coursedetail',vx);
      },
      bookcourse(id=''){
        // console.log(id,725)
        if(this.vo.id==='0' || this.vo.id==undefined || id==='0'){
            // 直接预约，非先买课
            Vtmp.$emit('directbook',{tname:this.vo.tname,id:0,back:'list'})
        }else{
            let buy = this.getbuy();
            let obj = {tname:this.vo.tname,cpid:buy.id,teacher:this.teacher};
              Vtmp.$emit('bookcourse',obj);
        }
        // $('#selectcourse').modal('hide');
        return ;
      },
      next(){
        
        
        if(this.vo.id == '0'){
          // 直接预约，非先买课
          
          $('#selectcourse').modal('hide');
            Vtmp.$emit('directbook',{tname:this.vo.tname,id:0,back:'list'})
          return ;
        }
        console.log(this.vo.id,746)
        if(!this.vo.id) return false;
        const item = this.items.find(item => item.id == this.vo.id);
         
        $('#selectcourse').modal('hide');
        this.vo.prev = 'selectcourse';
        this.vo.lessionstyle = item.lessionstyle;
        setTimeout(() => {
          Vtmp.$emit('courseoption',this.vo)
        }, 300);
      }
    }
  })
// 课程选项
  var Voption = new Vue({
    el:'#courseoption',
    data:{   ps:{},vo:{},cs:{id:'',price:''},tinfo:{},title:'',canbuy:true }, 
    mounted(){
      Vtmp.$on('courseoption',re=>{
        this.vo = re;
        $('#courseoption').modal('show');
        this.getprice();
        hidescroll();
      })
      $("#courseoption").on('hide.bs.modal', () =>{
          this.cs={};
          this.ps={};
          showscroll();
      })
    },
    methods:{
      getprice(){
        axios.post('/index/index/get_topic_price',{topicid:this.vo.id}).then(re=>{
            this.ps = re.data.group;
            this.tinfo = re.data.teacher;
            this.canbuy = re.data.canbuy;
            if(!this.vo.tname ){
              this.vo.tname = re.data.teacher.tname;
            }
            if(!this.canbuy){
                let tip = tippy('#btn_next1',{
                  content:LANG.dialog.purchase_limit_exceeded,
                });
                tip[0].show();
                
            }
            this.cs.col = Object.keys(this.ps).length==1?6:5;
            this.title = re.data.course.title;
            console.log(this.ps,this.tinfo,802)
            if(!this.cs.id){
              for(ix in this.ps){
                 for(sx in this.ps[ix]){
                     this.cs.id = this.ps[ix][sx].id;
                     this.cs.price = this.ps[ix][sx].price;
                     return;
                 }
              }
            }
        })
      },
       
      toggleprice(){
        // console.log('33333x',this.cs)
        const priceElements = document.querySelectorAll('.price');
        priceElements.forEach(element => {
                element.classList.remove('price-active');
            });

            // 给被点击的元素添加price-active样式
            event.currentTarget.classList.add('price-active');
            // 将被点击元素的 data-id 值赋值给 this.cs.id
            this.cs.id = event.currentTarget.getAttribute('data-id');
            this.checkprice();
            this.$forceUpdate();
      },
      checkprice(){
        let id = this.cs.id;
        for(ix in this.ps){
            for(sx in this.ps[ix]){
                if(this.ps[ix][sx].id==id){
                  this.cs.price = this.ps[ix][sx].price;
                  return;
                }
            }
        }
      },
       
      previou(){
        // 上一步
        $('#courseoption').modal('hide');
          Vtmp.$emit('selectcourse',{tname:this.vo.tname,id:this.vo.id,from:'aaa1'});
      },
      save(){
      // console.log(this.vo,this.cs,6333)
        this.vo.priceid = this.cs.id;
        this.vo.price = this.cs.price;
        // 验证是否已登录
        // let login = sessionStorage.getItem('loginstatus');
        if(sessionStorage.getItem('loginstatus')==1){
          // 已登录，写入到课程购买表
          axios.post('/student/index/course_purchased',this.vo).then(re=>{
              if(re.data.code == '001'){
                Vtmp.$emit('showannc',{status:'err',msg:re.data.msg})
                return;
              }
              if(re.data.lessonstyle == 4){
                 Vtmp.$emit('showannc',{status:'ok',msg:LANG.dialog.purchase_successful})
                 setTimeout(()=>{
                  Vtmp.$emit('bookcourse',{tname:this.vo.tname,topicid:re.data.pid});
                  $('#courseoption').modal('hide');
                    // return window.location.href='/student/index/courses';
                 },1000)
                 
              }else if(re.data.pid){
                window.location.href= '/student/payment/pay?pid='+re.data.pid;
              }
          })
          
        }else{
          console.log('未登录')
          // 未登录提醒
          let pop = {cmd:'courseoption',parms:this.vo};
          sessionStorage.setItem('first_pop',JSON.stringify(pop)); // 登录后自动执行后销毁
            Vtmp.$emit('dialog',{docmd:'login'});
          $('#courseoption').modal('hide');
        }
      },
       
    }
  })
// 预约课程
  var Vbook1 = new Vue({
    el:'#bookcourse',
    data:{vo:{balance:0},teacher:{},w48:{},week:{},info:{title:''},btn_pre:true,temp:{},ck:'',
          loading:true, jump:true,
          ismobile:false,begin:'',model:'',booked:0,slots:[],times:[],change:false
     },
    mounted(){
      // re=[tname,cpid]
      Vtmp.$on('bookcourse',re=>{
        //  console.log(re,889)
        this.vo = re;
        this.vo.id = this.vo.topicid??re.cpid;
        if(re.jump=='no'){this.jump=false;}
        this.get_this_course(this.vo.id);
 
        $('#bookcourse').modal('show');
        this.loadbcell();
        $("#bookcourse").on('hide.bs.modal', () =>{
          //  console.log(this.vo,999);
             if(this.change) { 
                Vtmp.$emit('reload',this.vo.topicid);
             }
        });
      })
       
    },
    methods:{
       
      get_this_course(cpid){
        axios.post('/student/index/get_this_course',{cpid:cpid}).then(re=>{
            this.vo = re.data.data;
            // this.vo.balance = re.data.qty - re.data.used - re.data.booking;
            this.teacher = re.data.teacher;
            this.vo.tname = this.teacher.tname;
            // this.getvalidcourse();
        })
      },
      loadbcell(){
        console.log('loadbcell',this.vo);
          axios.post('/student/index/get_book_cells',{tname:this.vo.tname, begin:this.begin, topicid:this.vo.id}).then(re=>{
            this.slots = re.data.slots;
            this.info.title = re.data.date;
            this.times = re.data.times;
            this.vo.balance = re.data.balance;
            // console.log(this.slots,this.times);
            this.loading = false;
            this.$forceUpdate();

          })
      },
      booking(vx,res,wk){
        // console.log(vx);
        if(vx.status==0){return false;}
        let idx = res.findIndex((item) => {
            // 判断当前元素是否包含了vx中的所有属性且值相同
            return Object.keys(vx).every((key) => item[key] === vx[key]);
        });

        if (idx == -1) {
            console.log("未找到匹配的子集，无法输出相应结果。");
            return false;
        }

        let duration = this.vo.duration;
        if(vx.status ==2 && vx.class=='checked'){
          console.log('取消预订')
          this.cancelbook(vx);
          vx.status = 1;
          vx.class = 'green'
          vx.bookuser = '';
           

          return false;
        }
        if(this.vo.balance<=0){
            alert(LANG.dialog.not_remaining_lessons);
            return false;
         }
        if(duration == 30){
            vx.status=2;
            vx.class = 'checked';
            // 预约课程
            this.book(vx,res,idx);
        }else{
          let n = Math.ceil(duration/30);
          let cando = true;
          for(let i=1;i<n;i++){
              let nx = res[idx + i]
              if(nx.status!==1){
                  cando = false;
                  break;
              }
            }
            if(!cando){
              alert(LANG.dialog.not_consecutive_slots);
              return false;
            }
            for(let i=1;i<n;i++){
              let nx = res[idx + i]
              nx.status = -1;
              nx.class = 'booked';
            }
            vx.status = 2;
            vx.class = 'checked';
            vx.bookuser = this.vo.username;
            // 预约课程
            this.book(vx,res,idx);
          }
         
      },
      book(vx,res,idx){
          this.change = true;
          axios.post('/student/index/book_lesson',vx).then(re=>{
              this.vo.balance--;
              let st = re.data.code=='000'?'ok':'err';
              Vtmp.$emit('showannc',{status:st,msg:re.data.msg})
               
              this.$forceUpdate();
              if(re.data.code!=='000'){
                this.undocheck(vx,res,idx);
                
                return;
              }
          })
      },
      undocheck(vx,res,idx){
        let duration = this.teacher.duration;
        if(duration>30){
          let n = Math.ceil(duration/30);
          // let cando = true;
          for(let i=1;i<n;i++){
              let nx = res[idx + i]
              nx.status = 1;
              nx.class = 'green';
            }
        } 
        vx.status = 1;
        vx.class = 'green';
        vx.bookuser = '';
        this.$forceUpdate();
      },
      cancelbook(vx){
          vx.status = 1;
          let now = Date.now()/1000;
          let msg = '';
          switch(true){
            case vx.stamp-now <1800:
              msg = LANG.dialog.refund_notice_30min;
              break;
            case vx.stamp-now <3600 && vx.stamp-now>=1800 :
              msg  = LANG.dialog.refund_notice_1hour;
              break;
            case vx.stamp-now >=3600:
              msg = '';
              break;
            default:
              msg = '';
              // return false;
          }
          if(msg){
            if(!confirm(msg)  ){
                return false;
            }
          }
          this.change = true;
          axios.post('/student/index/cancelabook',vx).then(re=>{
              Vtmp.$emit('showannc',{status:'ok',msg:re.data.msg})
              this.vo.balance = re.data.balance;
              this.loadbcell();
              
          })
      },
      btnpre(){
        let bb = this.begin;
        
        this.begin = this.lastweek();
        console.log(bb,11,this.begin,88)
        if(this.begin==bb)return false;
        if(this.info.pert == 0) return false;
        this.loadbcell(this.info.pert);
        
      },
      btn_next(){
        this.begin = this.getDatePlus7();
        return this.loadbcell(this.info.next);
      },
      close(){
          $('#bookcourse').modal('hide');
          Vtmp.$emit('reload','');
      },
      getDatePlus7() {
        // 如果 this.begin 为空字符串
        // 获取开始日期，如果为空则默认为当前日期
          const beginDate = new Date(this.begin || new Date());

        // 将日期增加 7 天
        beginDate.setDate(beginDate.getDate() + 7);

        // 格式化为 YYYY-MM-DD
        return beginDate.toISOString().split('T')[0];
      },
      lastweek() {
          // 获取开始日期，如果为空则默认为今天
          const beginDate = new Date(this.begin || new Date());
          // 将日期减去 7 天
          beginDate.setDate(beginDate.getDate() - 7);
          // 获取今天的日期
          const today = new Date();
          // 如果 beginDate 小于今天，则返回今天的日期
          return beginDate < today ? today.toISOString().split('T')[0] : beginDate.toISOString().split('T')[0];
        }
    },
    beforeDestroy() {
      Vtmp.$emit('reload','');
    }
  })
  // 直接预约
  var Vdirectbook = new Vue({
    el:'#directbook',
    data:{vo:{},teacher:{},w48:{},week:{},info:{title:''},btn_pre:true,temp:{},ck:'',loading:true,
          total:0, change:false,teacherlist:[],showTeacherList:false,
          ismobile:false,begin:'',model:'',booked:0,slots:[],times:[],
        },
    mounted(){
      Vtmp.$on('directbook',re=>{
        if(sessionStorage.getItem('loginstatus')==0){
          console.log('未登录');
            $('#selectcourse').modal('hide');
              Vtmp.$emit('dialog',{docmd:'login'})
            return false;
        } 
        this.vo = re;
        this.vo.duration = 30; 
        this.vo.balance = 999;
        this.vo.title = LANG.dialog.direct_booking;
        // this.teacher = re ;
        // 设置默认老师为teacherlist的第一个
        this.teacher = this.teacherlist && this.teacherlist.length > 0 ? this.teacherlist[0] : re;
        
        $('#directbook').modal('show');
        this.loadbcell();
        this.getteacherlist();
        $("#directbook").on('hide.bs.modal', () =>{
             if(this.change){
                Vtmp.$emit('reload',0);
             }  
        });
      })
       
    },
    methods:{
      checkusr(){
        let usr = JSON.parse(sessionStorage.getItem('_usr'));
        return usr.usertype == 3;
      } ,
      getteacherlist(){
        axios.post('/student/index/getmyteacherlist').then(re=>{
          this.teacherlist = re.data;
          // 获取到teacherlist后，设置默认老师为第一个
          if(this.teacherlist && this.teacherlist.length > 0) {
            this.teacher = this.teacherlist[0];
          }
        })
      },
      toggleTeacherList() {
        this.showTeacherList = !this.showTeacherList;
      },
      selectTeacher(teacher) {
        this.teacher = teacher;
        this.showTeacherList = false;
        // 重新加载课程时段
        this.vo.tname = teacher.tname;
        this.loadbcell();
      },
      loadbcell(){
          let vo = this.vo;
          vo.topicid = 0;
          vo.duration = 30;
          axios.post('/index/index/get_book_cells',{tname:this.vo.tname, begin:this.begin, topicid:0}).then(re=>{
            this.slots = re.data.slots;
            this.info.title = re.data.date;
            this.times = re.data.times;
            this.teacher = re.data.teacher;
            this.getallreserved(); 
            this.loading = false;
            this.$forceUpdate();

          })
      },
      getallreserved(){
         axios.post('/student/index/get_all_reserved').then(re=>{
            this.total = re.data.total;
            // this.booked = re.data.booked;
        })
      } ,
      booking(vx,res,wk){
         
        if(this.checkusr()){
          Vtmp.$emit('showannc',{status:'error',msg:LANG.dialog.teacher_cannot_book})
           return false;
        } 
        if(vx.status==0){return false;}
        let idx = res.findIndex((item) => {
            // 判断当前元素是否包含了vx中的所有属性且值相同
            return Object.keys(vx).every((key) => item[key] === vx[key]);
        });

        if (idx == -1) {
            console.log("未找到匹配的子集，无法输出相应结果。");
            return false;
        }

        let duration = 30;
        if(vx.status ==2) {
          // Vtmp.$emit('showannc',{status:'error',msg:"{:lang('dialog.cancel_in_my')}",time:3000})
          axios.post('/student/index/cancelabook',{stamp:vx.stamp,tname:vx.tname,topicid:0})
               .then(re=>{
                    if(re.data.status=='ok'){
                      vx.status = 1;
                      vx.class = 'green'
                      vx.bookuser = '';
                    }
                   Vtmp.$emit('showannc',{status:re.data.status,msg:re.data.msg}) 
                })
                
          // console.log("请在我的课程中取消",vx);return;
        }
        if( vx.status=3 && vx.class=='reserved-checked'){
          console.log('取消预订')
          this.cancel_reserved_book(vx);
          vx.status = 1;
          vx.class = 'green'
          vx.bookuser = '';
          // this.vo.balance++;

          return false;
        }else{
            vx.status=3;
            vx.class = 'reserved-checked';
            this.vo.balance--;
            // 预约课程
            this.book(vx);
         }
      },
      book(vx){
          vx.duration = 30;
          vx.title = LANG.dialog.chinese_private_lesson;
          this.change = true;
          axios.post('/student/index/reserved_lesson',vx).then(re=>{
              // console.log(vx.price,re.data);
              this.total  = (this.total*1+ vx.price*1).toFixed(2);
          })
      },
      cancel_reserved_book(vx){
          vx.status = 1;
          let now = Date.now()/1000;
          this.change=true;
          axios.post('/student/index/cancel_reserved_book',vx).then(re=>{
              Vtmp.$emit('showannc',{status:'ok',msg:LANG.dialog.cancellation_successful})
              this.loadbcell();
          })
      },
      btnpre(){
        let bb = this.begin;
        this.begin = this.lastweek();
        
        if(this.begin==bb)return false;
        if(this.info.pert == 0) return false;
        this.loadbcell(this.info.pert);
        
      },
      btn_next(){
        this.begin = this.getDatePlus7();
        return this.loadbcell(this.info.next);
      },
      goback(){
        $('#directbook').modal('hide');
          Vtmp.$emit('selectcourse',{tname:this.vo.tname,from:'aaa2'});
      },
      close(){
          $('#directbook').modal('hide');
      },
      checkout(){
          window.location.href= '/student/payment/pay?pid=0';
      },
      getDatePlus7() {
        // 获取开始日期，如果为空则默认为当前日期
          const beginDate = new Date(this.begin || new Date());
        // 将日期增加 7 天
        beginDate.setDate(beginDate.getDate() + 7);
        // 格式化为 YYYY-MM-DD
        return beginDate.toISOString().split('T')[0];
      },
      lastweek() {
          // 获取开始日期，如果为空则默认为今天
          const beginDate = new Date(this.begin || new Date());
          // 将日期减去 7 天
          beginDate.setDate(beginDate.getDate() - 7);
          // 获取今天的日期
          const today = new Date();
          // 如果 beginDate 小于今天，则返回今天的日期
          return beginDate < today ? today.toISOString().split('T')[0] : beginDate.toISOString().split('T')[0];
        }
    }
  })
  // 我的课程
  var Vmycourse = new Vue({
    el:'#mycourse',
    data:{
      items:[],btn:{},vo:{},type:'',msg:{title:'',subtitle:''}
    },
    mounted(){
        Vtmp.$on('mycourse',re=>{
        // console.log(re,9999);
        $('#mycourse').modal('show');
        this.getmycourselist();
        })
    },
    methods:{
       getmycourselist(){
        axios.post('/student/index/getmycourselist',{}).then(re=>{
           
            this.items = re.data.data;
            this.type = re.data.type; 
            if(this.type=='course'){
              this.msg.title = LANG.dialog.my_course;
              this.msg.subtitle = LANG.dialog.my_course2;
            }
            if(this.type == 'teacher'){
              this.msg.title = LANG.dialog.my_teacher;
              this.msg.subtitle = LANG.dialog.my_teacher2;
            }
            if(this.type == 'recommand'){
              this.msg.title = LANG.dialog.recommand_teacher;
              this.msg.subtitle = LANG.dialog.recommand_teacher2;
            }
          
        })
       },
       findteacher(){
        window.location.href= langPrefix+'/find_teachers';
       },
       bookcourse(vo){
          $('#mycourse').modal('hide');
            if(this.type=='course'){
              Vtmp.$emit('bookcourse',{tname:vo.tname,cpid:vo.id})
            }else{
              Vtmp.$emit('selectcourse',{tname:vo.tname,from:'mycourse'});
            }
       },
       showcourses(vo){
          $('#mycourse').modal('hide');
            Vtmp.$emit('selectcourse',{tname:vo.tname,from:'mycourse'});
       },
       gocourse(vo){
          // console.log(vo,1421);return;
          window.open('/course/'+vo.courseid);
       },
       goteacher(vo){
          window.location.href= langPrefix+'/teachers/'+vo.tname;
       }

    }
  })

  if(_geturlvv('type')=='directbook'){
      Vtmp.$emit('directbook',{tname:_geturlvv('tname'),id:0});
  }
 
  var Vpay = new Vue({
    el:'#paywindow',
    data:{},
    mounted(){
      Vtmp.$on('paywindow',re=>{
        $('#paywindow').modal('show');
         
      })
    },
    methods:{}
  })
 