var mobilesearch = {
    template:'#tmp_mobilesearch',
    data(){return{show:false,keyword:'',checked:[],
        cls:{timemenu:'',other:'',gender:'',course:'',speak:'',kemu:'',},
        gs:{
        'female':{text:LANG.teacher.fmale,class:''},
        'male':{text:LANG.teacher.male,class:''}, 
        },
        ta:{
        'sunrise':{text:LANG.teacher.sunrise,class:''},
        'morning':{text:LANG.teacher.morning,class:''},
        'afternoon':{text:LANG.teacher.afternoon,class:''},
        'evening':{text:LANG.teacher.evening,class:''},
        },
        wks:{
        'sunday':{text:LANG.index.week_7,class:''},
        'monday':{text:LANG.index.week_1,class:''},
        'tuesday':{text:LANG.index.week_2,class:''},
        'wednesday':{text:LANG.index.week_3,class:''},
        'thursday':{text:LANG.index.week_4,class:''},
        'friday':{text:LANG.index.week_5,class:''},
        'saturday':{text:LANG.index.week_6,class:''},
      },
        kemus:{
          'chinese':{text:LANG.index.chinese,class:''},
          'math':{text:LANG.index.math,class:''},
          'english':{text:LANG.index.english,class:''},
          'french':{text:LANG.index.french,class:''},
          'german':{text:LANG.index.german,class:''},
          'japanese':{text:LANG.index.japanese,class:''},
          'korean':{text:LANG.index.korean,class:''},
          'spanish':{text:LANG.index.spanish,class:''},
          'italian':{text:LANG.index.italian,class:''},
        },
      courses:{ // 课程类型
        'free':{text:LANG.teacher.free_lesson,class:''},
        'trial':{text:LANG.teacher.trial_lesson,class:''},
        'private':{text:LANG.teacher.private_lesson,class:''},
        'group':{text:LANG.teacher.group_lesson,class:''},
      },
      speaks:{
        'Chinese':{text:LANG.index.chinese,class:''},
        'English':{text:LANG.index.english,class:''},
        'French':{text:LANG.index.french,class:''},
        'German':{text:LANG.index.german,class:''},
        'Japanese':{text:LANG.index.japanese,class:''},
        'Korean':{text:LANG.index.korean,class:''},
        'Spanish':{text:LANG.index.spanish,class:''},
        'Italian':{text:LANG.index.italian,class:''},
      }
    }},
    mounted(){
      Vtmp.$on('removeso',re=>{
        // console.log(re,this.checked,667)
        if(re=='all'){
          this.checked = [];
          return;
        }
        const index = this.checked.indexOf(re);
            if (index !==-1) {
                // 如果存在，则从数组中移除
                this.checked.splice(index, 1);
            }
      })
      Vtmp.$on('mobilesch',re=>{
        this.show = true;
      })
      axios.post('/index/index/getskills').then(re=>{
          // console.log(re);
          this.sks = re.data;
        })
    },
    methods:{
      gclick(idx,st){
        const index = this.checked.indexOf(idx);
            if (index === -1) {
                // 如果不存在，则添加到数组
                this.checked.push(idx);
            } else {
                // 如果存在，则从数组中移除
                this.checked.splice(index, 1);
            }
        switch(st){
            case 'gender':
              this.gs[idx].class = !this.gs[idx].class ? 'CustomCheckbox--checked' : '';
              Vtmp.$emit('menuclick',{tag:'gender',idx:idx,text:this.gs[idx].text})
              break;
            case 'time':
              var txt = this.ta[idx].text;
              this.ta[idx].class = !this.ta[idx].class ? 'CustomCheckbox--checked' : '';
              Vtmp.$emit('menuclick',{tag:'time',idx:idx,text:txt})
              break;
            case 'week':
              var txt = this.wks[idx].text;
              this.wks[idx].class = !this.wks[idx].class ? 'CustomCheckbox--checked' : '';
              Vtmp.$emit('menuclick',{tag:'time',idx:idx,text:txt})
              break;
             
            case 'kemu':
              var txt = this.kemus[idx].text;
              this.kemus[idx].class = !this.kemus[idx].class ? 'CustomCheckbox--checked' : '';
              Vtmp.$emit('menuclick',{tag:'kemu',idx:idx,text:txt})
              break;
            case 'ltype':
              var txt = this.ltypes[idx].text;
              this.ltypes[idx].class = !this.ltypes[idx].class ? 'CustomCheckbox--checked' : '';
              Vtmp.$emit('menuclick',{tag:'ltyppe',idx:idx,text:txt})
              break;
             
            case 'speak':
              var txt = this.speaks[idx].text;
              this.speaks[idx].class = !this.speaks[idx].class ? 'CustomCheckbox--checked' : '';
              Vtmp.$emit('menuclick',{tag:'speak',idx:idx,text:txt})
              break;
             
            case 'course':
              var txt = this.courses[idx].text;
              this.courses[idx].class = !this.courses[idx].class ? 'CustomCheckbox--checked' : '';
              Vtmp.$emit('menuclick',{tag:'course',idx:idx,text:txt})
              break;
             
        }
        // console.log(this.checked,88);
        
      },
      sclick(idx,ix){
        let obj = this.sks[idx];
        obj[ix].class = obj[ix].class == '' ? 'CustomCheckbox--checked' : '';
        Vtmp.$emit('menuclick',{tag:'other',idx:obj[ix].tag,text:obj[ix].title});
      },
      mclick(){
          Vtmp.$emit('menuclick',{tag:'search',idx:'key',text:this.keyword})
          this.close();
      },
      
        // 判断当前元素是否激活
        isActive(tag) {
          // console.log(this.checked,tag,this.checked.includes(tag));
            return this.checked.includes(tag);
        },
      close(){
        this.show = false;
      },
      expland(dx){
        
        let obj = this.cls[dx];
        this.cls[dx] = !obj ? 'Accordion--open' : '';
      }
    }
 }
 var v_mb = new Vue({
  el:'#modals',
  data:{},
  mounted(){
    
  },
  components:{
    'mobilesearch': mobilesearch,
  }
 })