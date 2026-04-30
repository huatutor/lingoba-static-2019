  var v_login = {
    template:'#tmp_login',
    props:['dialogcmd','omail'],
    data(){return {
       show:'login', //显示
       tips:{mobile:'',email:''},
       lg:{user:'',pwd:'',qrcode:false,alert:false,alertinfo:'',qrdata:''},
       info:'',email_checked:false,
       reg:{name:'',fromcountry:'',email:'',flag:''},
       forget:{email:'',code:'',},
       hasyzm:false, yzmlock:false,
       ck:0,  
       yzm: {
          check: '',           // 用户输入的验证码
          disabled: false,     // 是否禁用按钮（倒计时）
          code: '',            // 后端下发的验证码（建议后台验证）
          sent: false,         // 是否已发送验证码
          label:'获取验证码',
          status: '',          // 'success' / 'fail'
          countdown: 0         // 倒计时
        },
       countries:[],

    }},
    mounted(){
      this.change(this.dialogcmd);
      // this.ssoload();
    },
     
    methods:{
      //  改变弹窗内容
       change(target){
         this.lg.alert = false;
         this.lg.alertinfo = '';
         if(target=='signup' && this.countries.length==0){
            this.getcountry();
         }
         this.show = target; 
       },
       is_wexin() {
          const userAgent = navigator.userAgent.toLowerCase();
          return /micromessenger/.test(userAgent);
        },
        getcountry(){
          axios.post('/index/index/getcountry').then(re=>{
            this.countries = re.data.data;
            this.getipinfo(); 
            this.getinvite();
          })
        },
        changecountry(){
          // this.reg.flag = 'fi-'+this.reg.areacode;
          for(let cc in this.countries){
              if(this.countries[cc].sname == this.reg.sname){
                  this.reg.flag = "fi-"+this.reg.sname.toLowerCase();
              }
            }
        },
        getipinfo(){
          let timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
   
          axios.post('/index/index/getipinfo').then(re=>{
              let ips = re.data;
              console.log(ips,384);
              let c2 = ips.country_code2;
              this.hasyzm = false; //c2=='CN' ?true: false;
              this.reg.utc = timezone;
              this.reg.sname = c2;
              this.reg.ipcountry = c2;
              this.reg.areacode = ips.calling_code;
              this.reg.currency = ips.currency.code;
              this.reg.ip = ips.ip;
              this.reg.city  = ips.city;
              this.reg.province = ips.state_prov;
              this.reg.country = ips.country_name;
              // this.reg.timezone = timezone;
              this.reg.fromcountry = ips.cf_country.toLowerCase();
              this.changecountry();
              // console.log(this.reg,397);
          })
        },

        mail_check() {
          const email = this.reg.email.trim();
          const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!re.test(email)) {
            this.tips.email = LANG.dialog.invalid_email;
            this.email_checked = false;
            return Promise.resolve(false);
          }

          return axios.post('/index/index/ajax_checkemail', { email }).then(res => {
            if (res.data == '0') {
              this.tips.email = LANG.dialog.email_registered;
              this.email_checked = false;
              return false;
            } else {
              this.tips.email = '';
              this.email_checked = true;
              // 读取倒计时
              const expireAt = parseInt(sessionStorage.getItem('yzm_expire_time'));
              const email = sessionStorage.getItem('yzm_email');
              const now = Date.now();

              if (expireAt  && now < expireAt) {
                  const remaining = Math.floor((expireAt - now) / 1000);
                  this.yzm.countdown = remaining;
                  this.yzm.disabled = true;
                  this.yzm.sent = true; // 如果需要立即显示验证码输入框
                  this.startCountdown();
              }
              return true;
            }
          });
        },
        getinvite(){
              axios.post('/index/index/getinvite').then(re=>{
                  this.reg.invite = re.data;
              })
          },
        send_yzm_code() {
          const email = this.reg.email.trim();
          const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          let checked = true;
          if (!re.test(email)) {
            this.tips.email = LANG.dialog.invalid_email;
            checked = false;
            return Promise.resolve(false);
          }
            if (!checked) {
              this.tips.email = LANG.dialog.enter_invalid_email;
              return;
            }

            // 设置为 loading 状态
            this.yzm.disabled = true;
            this.yzmlock = false;
            this.tips.email = '';
            axios.post('/index/index/sendyzmcode', { email: this.reg.email }).then(res => {
                const now = Date.now();
                console.log(res.data,409)
                if (res.data.code == 1) {
                  // 成功发送验证码
                  const expireAt = now + 60 * 1000;
                  sessionStorage.setItem('yzm_expire_time', expireAt.toString());
                  sessionStorage.setItem('yzm_email', this.reg.email);
                  this.tips.email = LANG.dialog.verification_sent;
                  this.yzm.sent = true;
                  this.yzm.status = '';
                  this.yzm.countdown = 60;
                  this.startCountdown();
                } else if (res.data.wait) {
                  // 被限制了：重新设置等待时间
                  const expireAt = now + res.data.wait * 1000;
                  sessionStorage.setItem('yzm_expire_time', expireAt.toString());
                  sessionStorage.setItem('yzm_email', this.reg.email);

                  this.yzm.sent = false; // 还不能发送
                  this.yzm.countdown = res.data.wait;
                  this.startCountdown();

                  this.tips.email = res.data.msg || LANG.dialog.try_again_later;
                } else {
                  // 其他错误
                  this.yzm.disabled = false;
                  this.tips.email = res.data.msg || LANG.dialog.verification_failed;
                  this.yzm.countdown = 0;
                  sessionStorage.removeItem('yzm_expire_time');
                  sessionStorage.removeItem('yzm_email');
                }
            }).catch(error => {
              console.error('Axios error:', error);
              console.error('Status:', error.response?.status);
              console.error('Body:', error.response?.data);
            });
          },
        startCountdown() {
          // 如果已有定时器，先清除
          if (this.ck) {
            clearInterval(this.ck);
          }
          this.ck = setInterval(() => {
            this.yzm.countdown--;
            if (this.yzm.countdown <= 0) {
              clearInterval(this.ck);
              this.yzm.disabled = false;
              sessionStorage.removeItem('yzm_expire_time');
              sessionStorage.removeItem('yzm_email');
            }
          }, 1000);
        },
        onCodeInput(e) {
          const val = e.target.value;
          if (val.length === 6) {
            this.verify_code();
          }else if(val.length <6){
             this.yzm.status = '';
          }
        },
        verify_code() {
          if(this.yzmlock) return false;
          return axios.post('/index/index/verifycode', {
            email: this.reg.email,
            code: this.yzm.check // 转为字符串并补齐6位,避免丢失前导0
          }).then(res => {
            if (res.data.code === 1) {
              this.yzm.status = 'success';
            } else {
              this.yzm.status = 'fail';
            }
            if(res.data.code === 2){
               this.tips.email = res.data.msg;
            }
          });
        },
        clearalert(){
            this.lg.alert = false;
            this.lg.alertinfo="";
          },
        async signup_save() {
          if (!this.reg.name.trim()) {
            this.lg.alert = true;
            this.lg.alertinfo = LANG.dialog.enter_student_name;
            return;
          }

          await this.mail_check();
          if (!this.email_checked) {
            this.lg.alert = true;
            this.lg.alertinfo = LANG.dialog.email_invalid_or_registered;
            return;
          }

          if (!this.yzm.sent || this.yzm.status !== 'success') {
            this.lg.alert = true;
            this.lg.alertinfo = LANG.dialog.verify_email_first;
            return;
          }

          // 一切通过后，提交注册
          axios.post('/index/index/signup_save', {
            vo:this.reg,
            code: this.yzm.check,
          }).then(re => {
                let res = re.data;
                  if(res.code == 200){
                      sessionStorage.setItem('_usr',JSON.stringify(res.usr));
                      localStorage.setItem('_token',res.token);
                      window.location.href="/index/index/setbaseprofile";
                  }else{
                    Vtmp.$on('showannc',{status:'error',msg:res.info});
                    this.loading = false;
                  }
          });
        },
        
        // login
        changelogin(){
           this.lg.qrcode = !this.lg.qrcode;
           clearInterval(this.ck);
           if(this.lg.qrcode){
              this.loadqrcode();
           }
           this.$forceUpdate();
        },
        loginsubmit(){
           if(this.lg.user.length<5){
            this.lg.alert = true;
            this.lg.alertinfo = LANG.dialog.enter_student_id_or_email;
            return false;
         }
         if(this.lg.password.length<4){
            this.lg.alert = true;
            this.lg.alertinfo = LANG.dialog.enter_password;
            return false;
         }
          let rex = location.pathname+location.search;
         
          let _parms = {'user':this.lg.user,'password':this.lg.password,'re':rex}
          axios.post('/index/index/loginauthorize',_parms).then(re=>{
            //  console.log(re.data,1001)
              if(re.data.code != '000'){
                 this.lg.alert = true;
                 this.lg.alertinfo = re.data.msg;
              }else{
                let usr = re.data.usr;
                // console.log(usr,576);
                sessionStorage.setItem('_usr',JSON.stringify(usr));
                localStorage.setItem('_token',re.data.token);
                let url = re.data.re;
                if(!url){
                  url = '/';
                }
                // console.log(url,582);
                window.location.href= url;
              }
          })
        },
        loadqrcode(){
          axios.post('/index/index/getloginqrcode').then(re=>{
            this.lg.qrdata = re.data;
            this.checkqrcode();
          })
        },
        checkqrcode(){
          this.ck = setInterval(()=>{
              
              axios.post('/index/index/checkqrcodelogin').then(re=>{
                
                let bk = re.data;
                if(bk.code =='000'){
                   this.info=LANG.dialog.waiting_for_scan;
                }
                if(bk.code == '001'){
                  console.log(bk);
                  if(bk.login == 'success'){
                      this.info = LANG.dialog.login_success;
                      sessionStorage.removeItem('_usr');
                      window.location.href="/student";
                  }else{
                      this.info = LANG.dialog.login_failed;
                  }
                  
                }
                if(bk.code == '002'){
                    window.location.href="/student";
                }
                if(bk.code == '003'){
                   this.info = '微信号没有关联账号，请先登录并关联。';
                }
              })
            },2000)

           
        },

        resetpwd(){
          this.lg.alert = false;
          
          if( this.yzm.status === 'success'){
              this.lg.alert = true;
              
              axios.post('/index/index/forgetpwd',{email:this.reg.email,code:this.yzm.check}).then(re=>{
                  console.log(re.data,re.data.code,615);
                    if(re.data.code == '000'){
                         this.change('login') ;
                        setTimeout(() => {
                          this.lg.alert = true;
                          this.lg.alertinfo = re.data.msg ;
                          this.lg.user = re.data.user || this.reg.email;
                        }, 100);
                    }else{
                      this.lg.alert = true;
                      this.lg.alertinfo = re.data.msg ;
                    }
                   
                      //TODO 密码重置后需要推送短信和微信消息
              })
              return false;
          }
        },
         
        close() {
            // 触发自定义事件
            Vtmp.$emit('todo', 'closeme');

            // 获取当前页面的 URL
            const currentUrl = window.location.href;

            // 判断 URL 是否包含 register 并且包含 re 参数
            const isRegisterPage = currentUrl.includes('/register');
            let reParam = new URLSearchParams(window.location.search).get('re');

            if (isRegisterPage && reParam) {
                // 解析 re 参数作为一个 URL
                const reUrl = new URL(decodeURIComponent(reParam), window.location.origin);
                const reSearchParams = new URLSearchParams(reUrl.search);

                // 移除 re 参数中的 type 参数
                reSearchParams.delete('type');

                // 更新 reUrl 的查询部分，去掉 type 参数
                reUrl.search = reSearchParams.toString();

                // 跳转到新的 URL
                window.location.href = reUrl.toString();
            }
        },
        ssoload(){
          window.addEventListener('message', function(event) {
              const data = event.data;
              const trustedTypes = ['auth-check', 'sso', 'user-auth']; // 自己约定的类型
              // 忽略非业务消息（插件注入、调试消息等）
              if (typeof data !== 'object' || data.type !=='sso') {
                return;
              }
          
              if (event.origin !== 'https://{$domain.cn}') {
                console.warn('Invalid origin:', event.origin);
                return;
              }

              // 处理接收到的消息
              let res = event.data;
              let n=sessionStorage.getItem('alogincount')??0;
              if(res.status){
          
                let url = window.location.href;
                Vtmp.$emit('showannc',{msg:LANG.msg.autologin,'status':'ok'})
          
                axios.post('/index/index/croslogiin2',res).then(re=>{
                  console.log(re.data);
                
                  if(re.data==1 && n<2){
                    n++;
                    sessionStorage.setItem('alogincount',n);
                    setTimeout(() => {
                      window.location.href=url; 
                    }, 1000);
                    
                  }
                })
              }
              // document.getElementById('messageFromB').innerText = 'Message from B站: ' + event.data;
            });
        }
      
    },
    beforeDestroy() {
      if (this.ck) {
        clearInterval(this.ck);
      }
    }
  }
  
  var v_dialog = new Vue({
    el: '#modalsRoot',
    data: {
      css: '',
      style: '',
      showlogin : false,
      prop_cmd:'',
      omail:'',
      reurl:''
    },
    components: {
      'signup':v_login,
    },
    mounted() {
      Vtmp.$on('dialog', str => {
        console.log('str=', str,24)

        if(str.docmd == 'login' || str.docmd == "signup" || str.docmd=="forgetpwd"){
           this.showlogin = true;
           this.omail = str.email;
           this.prop_cmd =str.docmd;
           this.reurl = str.reurl;
        }
        // console.log('str=', str)
      });

      Vtmp.$on('todo',re=>{
        if(re == 'closeme'){
          return this.close();
        }
      })

    },
    methods: {
      close(){
         this.showlogin = false;
      },
      dothing(parm) {
        if (parm == 'cancel') {
          this.showlogin = false;
        }
      },
    },
    watch: {
      showdialog: function () {
        if (this.showdialog || this.showlogin ) {
          this.css = 'modal-open';
          this.style = 'overflow: hidden;'
        } else {
          this.css = "";
          this.style = ""
        }
      },
        
    },
    computed:{
        
    }
  })