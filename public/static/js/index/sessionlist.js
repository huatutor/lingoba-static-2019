 
  var sessionlist = {
    template: '#tmp_session',
    props: ['indate'],
    data() {
      return {
        items: [], wdate: [], pages: {}, parms: {}, sid: '',
        sc: [], loading: false, ios: false, android: false, other: false, ck: '',
        dday: 'today', lastLoadTime: 0//缓存时间
      }
    },

    created: function () {
      this.ismobile();
    },
    mounted() {

      Vtmp.$on('hideSession', re => {
        // console.log(re);
        for (key in this.items) {
          if (this.items[key].stamp == re.stamp) {
            this.items[key].show = false;
          }
        }
      });
      Vtmp.$on('gets', dt => {
        this.loading = false;
        this.sid = dt.lessionid;
        this.begin = dt.begin;
        // if (dt.status === '') {
        //   // 没有指定时间，默认今天
        //   dt.begin = new Date().toISOString().slice(0, 10);
        // }
        return this.sessionlisting(dt);
      })
      Vtmp.$on('reload', re => {
        return this.sessionlisting(); //重新加载
      })
      // 监听事件，检查是否可以执行加载操作
      Vtmp.$on('sessionreload', re => {
        // 获取当前时间戳
        const currentTime = Date.now();

        // 检查当前时间与上一次加载时间的间隔是否超过10秒
        if (currentTime - this.lastLoadTime >= 10000) {
          // 执行加载操作
          this.sessionlisting({ begin: 'today'  });

          // 更新上一次加载时间为当前时间
          this.lastLoadTime = currentTime;
        } else {
          // 如果未超过10秒，可以选择忽略加载操作或者进行其他处理
          console.log('10秒后再进行加载');
        }
      });

      this.downtime();
      // 2个功能，1.自动刷新，获取最新的课程状态
      // 2；如果显示的不是今天的课程列表，2分钟后调回
      // 自动刷新时间，最好分开刷新，不要都集中在一起。 所以用时差除以60
      // 如果不是今天，则暂停刷新状态，2分钟后再次刷新回今天的课程列表


    },
    methods: {
      downtime() {
        // 清除之前的定时器
        clearInterval(this.ck);

        // 设置新的定时器
        this.ck = setInterval(() => {
          // 获取当前时间戳（秒）
          let _now = Math.floor(Date.now() / 1000);

          // 遍历items，更新每个项目的倒计时状态
          for (let key in this.items) {
            let now = Math.floor(Date.now() / 1000);
            let item = this.items[key];
            item = this.setstatus(item);
            // console.log(item,80)              
          }
          
        }, 1000);
      },
      // 计算距离上课时间的字符串
      calculateDistance(start, endstamp) {
        let nowstamp = Math.floor(Date.now() / 1000);
        if (nowstamp >= endstamp) return 'Expires';
        let mm,ss;
        let abs = start - nowstamp; 
        if (abs > 0) {
          const dd = Math.floor(abs / 86400);
          const hh = Math.floor((abs / 3600) % 24);
          const dStr = dd > 0 ? dd + 'd ' : '';
          mm = Math.floor((abs / 60) % 60);
          ss = Math.floor(abs % 60);
          return `${LANG.index.start_in}${dStr}${hh}h ${mm}m ${ss}s`;
        }else{
          abs = nowstamp - start ;
           mm = Math.floor((abs / 60) % 60);
           ss = Math.floor(abs % 60);
        }

        return `${LANG.index.class_in_progress}${mm} ${LANG.index.mins}${ss} ${LANG.index.sec}`;
      },

      // 格式化时间为MM:SS
      formatTime(countdown) {
        const pad = n => n < 10 ? '0' + n : n;
        const mm = Math.floor((countdown / 60) % 60);
        const ss = Math.floor(countdown % 60);
        return `${pad(mm)}:${pad(ss)}`;
      },

      sessionlisting(opts) {
        // 1. 合并参数
        if (opts) {
            if (opts.begin === 'today') {
                 Vtmp.$emit('clearselected');
            }
            this.parms = Object.assign({}, this.parms, opts);
        }

        // 2. 判断模式
        const isListMode = location.pathname.indexOf('lessons') > 0;
        const url = isListMode ? '/student/module/getBookingList' : '/student/module/getDailyBookingList';

        // 3. 构建请求数据
        let payload = {};
        if (isListMode) {
            payload = {
                status: this.parms.status,
                topicid: this.parms.topicid,
                page: this.parms.page || 1
            };
        } else {
            payload = {
                date: (this.parms.begin === 'today') ? '' : this.parms.begin
            };
        }

        // 4. 发送请求
        this.loading = true;
        this.$http.post(url, payload).then(re => {
            this.loading = false;
            const data = re.data;
            if (data) {
                this.items = data.list || [];
                this.wdate = data.wdate || [];
                this.pages = data.pages || {};
            }
        }).catch(err => {
            this.loading = false;
            console.error("Load session failed:", err);
        });
      },
      action(vo) {
        if (vo.available == 9) {
          console.log('hello,world');
        }
      },
      // 延后一分钟加载
      reload(){
        setTimeout(() => {
            this.sessionlisting(this.parms);
        }, 60000);
      },

      gototc(t) {
        location.href = '/teachers/' + t;
      },
      preview() {
        let page = this.pages.page;
        if (page > 1) {
          this.clickpage(page - 1);
        } else {
          return false;
        }
      },
      next() {
        let page = this.pages.page;
        page = parseInt(page);
        page = page >= this.pages.pg ? this.pages.pg : page + 1;
        this.clickpage(page);
      },
      clickpage(n, idx = 0) {
        if (n == "...") {
          n = this.page;
          n = idx ? n + 5 : n - 5;
        }
        this.page = n;
        this.parms.page = this.page;
        this.sessionlisting(this.parms);
      },
      getPageInfo() {
        let lang = '{$langset}'; // 语言设置 ('zh-cn' 或 'en-us')
        let totals = this.pages.count;
        if (lang === 'zh-cn') {
          return `第 ${this.pages.page} 页，共 ${this.pages.pg} 页${totals > 0 ? ` 记录：${totals}` : ''}`;
        } else {
          return `Page ${this.pages.page} of ${this.pages.pg}${totals > 0 ? `, Records: ${totals}` : ''}`;
        }
      },
      user_info(u) {
        window.open("{:prefix('/teachers/')}" + u);
      },
      opration(cmd, vx) {
        cmd['docmd'] = vx;

        // console.log(cmd,vx);
        Vtmp.$emit('dialog', cmd);
      },
      setstatus(obj) {
        let nowstamp = Math.floor(Date.now() / 1000);
        let cd = obj['stamp'] - nowstamp;
        let ed = obj['endstamp'] - nowstamp;
        let old_debug = obj['debug'];

        switch (true) {
          case cd > 1800:  //预约中
            obj['bgcolor'] = 'btn_huatutor--blue';
            obj['color'] = 'hua_text--blue';
            obj['distance'] = this.calculateDistance(obj['stamp'], obj['endstamp']);
            obj['countdown'] = cd;
            obj['disabled'] = true;
            obj['btn_label'] = LANG.index.booked;
            obj['available'] = 2;
            obj['debug'] = 1;
            break;
          case cd <= 1800 && cd > 480: //即将上课
            obj['bgcolor'] = 'btn_huatutor--blue';
            obj['color'] = 'hua_text--blue';
            obj['distance'] = this.calculateDistance(obj['stamp'], obj['endstamp']);
            obj['countdown'] = cd;
            obj['disabled'] = true;
            obj['btn_label'] = this.formatTime(cd);
            obj['available'] = 21;
            obj['debug'] = 2;
            break;
          case cd <= 480 && ed > 0: //上课中
            obj['bgcolor'] = 'btn_huatutor--red';
            obj['color'] = 'hua_text--red';
            obj['distance'] = this.calculateDistance(obj['stamp'], obj['endstamp']);
            obj['countdown'] = ed;
            obj['disabled'] = false;
            obj['btn_label'] = LANG.index.enter_classroom;
            obj['available'] = 22;
            obj['debug'] = 3;
            break;
          case ed < 0: //已结束
            // 增加判断课程状态
            if(obj['available']==3){
              obj['bgcolor'] = 'btn_huatutor--orange';
              obj['color'] = 'hua_text--orange';
              obj['btn_label'] = LANG.status.pending_evaluation;
              obj['disabled'] = false;
            }else{
              obj['bgcolor'] = 'btn_huatutor--brown';
              obj['color'] = 'hua_text--brown';
              obj['btn_label'] = LANG.status.not_attended;
              obj['disabled'] = true;
            }
            obj['countdown'] = 0;
            obj['distance'] = 'Expirese';
            // obj['available'] = 3;
            obj['debug'] = 4;
            break;
        }
        if (old_debug && old_debug != obj['debug']) {
           this.reload();
        }
        // console.log(obj,286)
      return obj;
      },
      
      sendmsg(user) {
        localStorage.setItem('chat', user);
        window.open('/chat', 'message');
      },

      ismobile() { //
        var d = navigator.userAgent;
        switch (function () { for (var a = ["Android", "iPhone", "SymbianOS", "Windows Phone", "iPad", "iPod"], n = "", i = 0; i < a.length; i++)if (0 < d.indexOf(a[i])) { n = a[i]; break } return n }()) {
          case "iPhone":
          case "iPad":
            this.ios = true;
            this.android = false;
            this.other = false;
            break;
          case "Android":
            this.ios = false;
            this.android = true;
            this.other = false;
            break;
          default:
            this.ios = false;
            this.android = false;
            this.other = true;
        }
      },
      startsession(vo) {
        if (vo.available == 9) {
          axios.post('/student/index/confirmreserved', { id: vo.id }).then(re => {
            this.sessionlisting('today');
            let s = 'fail';
            if (re.data.code == '000') {
              s = 'ok';
            }
            Vtmp.$emit('showannc', { status: s, msg: re.data.msg })
          })
          return;
        }
        // console.log(vo);
        if (vo.status_code == '30') {
          // console.log(vo);
          this.opration(vo, 'comment');
        } else {
          //写入第一次进入教室时间
          vo.enterroom = 'loading...';
          let _params = { 'stamp': vo.stamp, 'lessionid': vo.id }
          axios.post('/student/module/startsession', _params).then(re => {
            let ss = re.data;

            if (ss.client == 'Talk-Cloud') {
              let wurl = '/lesson/' + vo.id + '/?' + ss.ecc;
              // window.open(ss.userurl,'huatutor'); //平板电脑会出问题，不可使用
              window.location.href = wurl;
              if (ss.duration != 30) {
                // 更新结束时间
                axios.post('/student/module/tk_modifyroom', ss).then(re => {
                })
              }
            }

          })
        }
      },
      prezero(n) { if (n * 1 < 10) { n = '0' + n; } return n; },
      fmtlessionstyle(lstyle) {
        switch (lstyle) {
          case 1:
            return LANG.index['1v1_class'];
            break;
          case 2:
            return LANG.index.free;
            break;
          case 3:
            return LANG.index.topic;
            break;
          case 4:
            return LANG.index.welfare;
            break;
          case 5:
            return LANG.index.small_group;
            break;

          default:
            return LANG.index['1v1_class'];

        }
      },
    },

    computed: {
      ctz(n) { if (n * 1 < 10) { n = '0' + n; } return n; },

      c_pg() {
        if (this.pg < 5) return this.pages.pg;
        let pg = this.pages.pg;
        let page = this.pages.page;
        page = parseInt(page);
        let pre = (page - 2 < 1) ? 1 : page - 2;
        let nxt = (page + 3 >= pg) ? pg : page + 3;
        let dot = '...';
        let cpg = new Array();
        // console.log(pre,nxt,page);
        for (let i = pre; i <= nxt; i++) {
          cpg.push(i);
        }
        if (pre > 1) cpg.unshift(dot);
        if (nxt < pg) {
          cpg.push(dot);
          cpg.push(pg);
        }

        return cpg;
      }
    },

  }

  var sl = new Vue({
    el: '.LoadingOverlay',

    components: {
      'Session': sessionlist,
    }
  })

  //数组对象排序

 