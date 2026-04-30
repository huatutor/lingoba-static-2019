var announce = {
      template: '#tmp_ann',
      props: ['info'],
      data() {
        return {icon:'ok',bgcolor:'' }
      },
      
      mounted(){
        let st = this.info.status;
        // console.log(st,'hello,world')
        if(st == 'ok'){
          this.bgcolor = '#90ee90';
          this.icon = "/static/img/icons8-ok.svg";
        }else{
          this.bgcolor = '#ff6961';
          this.icon = "/static/img/icons8-high_priority.svg";
        }
      },
      methods: {
        close() {
          this.$emit('close', false);
        },
      }, 
    }
    var anv = new Vue({
        el: '#AnnouncementCenter',
        data: {
          showann: false,
          right: -300,       // 初始状态位置
          time: 3000,
          message: '',       // 消息内容
          openTimer: null,   // 用于打开动画的定时器
          closeTimer: null,  // 用于关闭动画的定时器
          autoClose: null    // 自动关闭延时器
        },
        components: {
          'Announcement': announce
        },
        mounted() {
          Vtmp.$on('showannc', re => {
            console.log('showannc')
            // 清除之前的所有定时器
            if (this.openTimer) {
              clearInterval(this.openTimer);
              this.openTimer = null;
            }
            if (this.closeTimer) {
              clearInterval(this.closeTimer);
              this.closeTimer = null;
            }
            if (this.autoClose) {
              clearTimeout(this.autoClose);
              this.autoClose = null;
            }
            // 重置初始状态（比如位置）
            this.right = -300;

            // 设置新消息
            this.message = re;
            // 如果传入了自定义显示时间，则使用该值
            if (re.time) {
              this.time = re.time;
            }
            // 显示公告
            this.showann = true;

            // 开始执行“滑入”动画（打开动画）
            let i = 1;
            this.openTimer = setInterval(() => {
              // 此处计算方式可根据实际需求调整
              this.right = (i * 10 + 10) - 300;
              i++;
              if (i >= 30) {
                clearInterval(this.openTimer);
                this.openTimer = null;
              }
            }, 10);

            // 设置自动关闭延时器，在设定时间后执行关闭动画
            this.autoClose = setTimeout(() => {
              this.closeAnnouncement();
            }, this.time);
          });
        },
        methods: {
          closeAnnouncement() {
            // 如果打开动画尚未结束，则先清除
            if (this.openTimer) {
              clearInterval(this.openTimer);
              this.openTimer = null;
            }
            // 开始执行“滑出”动画（关闭动画）
            let i = 1;
            this.closeTimer = setInterval(() => {
              this.right = 10 - (i * 10 + 10);
              i++;
              if (i >= 30) {
                clearInterval(this.closeTimer);
                this.closeTimer = null;
                this.showann = false;
              }
            }, 10);
          },
          close(){
            
          }
        }
      });
