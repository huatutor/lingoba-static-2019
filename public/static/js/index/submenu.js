var subheader = {
    template:'#tmp_subheader2',
    props:['select'],
    data(){return{
        ban:false, 
        selected:'',
        menus:{
            'message':{
                text:LANG.submenu.message,
                url: window.langPrefix+'/chat',
                selected:'SubHeaderBase--unselected',
                icon:'/static/img/icons8-collaboration_female_male.svg',
                aria:false,
            },
            'find_teachers':{
                text:LANG.submenu.findteachers,
                url: window.langPrefix+'/find_teachers',
                selected:'SubHeaderBase--unselected',
                icon:'/static/img/icons8-groups.svg',
                aria:false,
            },
 
            'price':{
                text:LANG.submenu.price,
                url: window.langPrefix+'/price',
                selected:'SubHeaderBase--unselected',
                icon:'/static/img/icons8-payroll.svg',
                aria:false,
            },
            'invite':{
                    text:LANG.submenu.invite,
                    url: window.langPrefix+'/student/settings/invite',
                    selected:'SubHeaderBase--unselected',
                    icon : '/static/img/icons8-share.svg',
                    aria:false,
                },
            'support':{
                text:LANG.submenu.support,
                url: window.langPrefix+'/help',
                selected:'SubHeaderBase--unselected',
                icon:'/static/img/icons8-help.svg',
                aria:false,
            },
            
            'other':{
                    text:LANG.submenu.other,
                    url: window.langPrefix+'/student/settings/profile',
                    selected:'SubHeaderBase--unselected',
                    icon:'/static/img/icons8-invite.svg',
                    aria:false,
                },
        },
        items:{'index':{
                    text:LANG.submenu.home,
                    url: window.langPrefix+'/student',
                    selected:'SubHeaderBase--unselected',
                    icon:'/static/img/icons8-home.svg',
                    aria:false,
                },
                'lessons':{
                    text:LANG.submenu.lessons,
                    url: window.langPrefix+'/student/index/courses',
                    selected:'SubHeaderBase--unselected',
                    icon:'/static/img/icons8-curriculum.svg',
                    dropdown:[],
                    aria:false,
                },
                'mytopiclessons':{
                    text:LANG.submenu.logs,
                    url: window.langPrefix+'/student/index/lessons',
                    selected:'SubHeaderBase--unselected',
                    icon:'/static/img/icons8-calendar.svg',
                    dropdown:['topiclessons','mytopiclessons','batchcancel'],
                    aria:false,
                },
                
 
                'teachers':{
                    text:LANG.submenu.myteacher,
                    url: window.langPrefix+'/student/index/mytutors',
                    selected:'SubHeaderBase--unselected',
                    icon:'/static/img/icons8-user_group_man_woman.svg',
                    aria:false,
                },
                'orders':{
                    text:LANG.submenu.orders,
                    url: window.langPrefix+'/student/payment/orders',
                    selected:'SubHeaderBase--unselected',
                    icon:'/static/img/icons8-news.svg',
                    dropdown:['orders','orderinfo'],
                    aria:false,
                },
                
 
                'teachers':{
                    text:LANG.submenu.myteacher,
                    url: window.langPrefix+'/student/index/mytutors',
                    selected:'SubHeaderBase--unselected',
                    icon:'/static/img/icons8-user_group_man_woman.svg',
                    aria:false,
                },
                'orders':{
                    text:LANG.submenu.orders,
                    url: window.langPrefix+'/student/payment/orders',
                    selected:'SubHeaderBase--unselected',
                    icon:'/static/img/icons8-news.svg',
                    dropdown:['orders','orderinfo'],
                    aria:false,
                },
 
                'credits':{
                    text:LANG.submenu.billings,
                    url: window.langPrefix+'/student/payment/credits',
                    selected:'SubHeaderBase--unselected',
                    icon:'/static/img/icons8-stack_of_money.svg',
                    aria:false,
                },
                 
 
                 
            },
            sect:false,
            mobi:{
                subhead:false,
                subhead_fa:'fa-angle-up',
                mtxt:LANG.submenu.showmenu,
            }
 
    }},
    
    mounted(){
        this.sect = false;
        let url = window.location.href;
        // url = url.split('/');
        // let p =url[url.length-1];
        for (let idx in this.items){
            let u = this.items[idx].url;
            if(url.indexOf(u)>=0){
                this.items[idx].selected = "SubHeaderBase--selected";
                this.items[idx].aria = true;
                this.selected = this.items[idx].text;
                this.sect = true;
            }
            if(this.items[idx].dropdown){
                // console.log(this.items[idx].dropdown);
                var arr = this.items[idx].dropdown;
                for(ix in arr){
                    if(url.indexOf(arr[ix])>0){
                        this.items[idx].selected = "SubHeaderBase--selected";
                        this.items[idx].aria = true;
                        this.items['index'].selected = "SubHeaderBase--unselected";
                        this.items['index'].aria = false;
                        this.sect = true;
                        break;
                    }
                }
            }
        } 
        this.selected = this.selected==LANG.submenu.home?'':this.selected;
        if(!this.sect){
            this.items['index'].selected = "SubHeaderBase--selected";
            this.items['index'].aria = true;
        }else{
            if(this.sect && this.selected!=''){
                this.items['index'].selected = "SubHeaderBase--unselected";
                this.items['index'].aria = false;
            }
        }
        
    },
    methods:{
        togglesubhead(){
            let sh = this.mobi.subhead;
            if(sh){
                this.mobi.subhead = false;
                this.mobi.subhead_fa = 'fa-angle-up'
                this.mobi.mtxt = LANG.submenu.showmenu;

            }else{
                this.mobi.subhead = true;
                this.mobi.subhead_fa = 'fa-angle-down'
                this.mobi.mtxt = LANG.submenu.hidemenu;
            }
            console.log(this.mobi);
        }
    }
     
}
var vsubheader = new Vue({
    el:'#SubHeader',
    data:{flag:false },
    mounted(){
        this.isUser(); 
         
    },
    components:{
        'subheader':subheader
    },
    methods:{
        isUser() {
            try {
                let userStr = sessionStorage.getItem('_usr');
                let user;

                // 检查 sessionStorage 中的用户信息是否存在
                if (!userStr) {
                    // 发起请求获取用户信息
                    axios.post('/index/index/usrcookie')
                        .then(response => {
                            user = response.data;
                            if (user) {
                                // 仅在请求成功且数据非空时存储用户信息
                                sessionStorage.setItem('_usr', JSON.stringify(user));
                                this.checkUserType(user);
                            }
                        })
                        .catch(error => {
                            console.log('获取用户信息失败:', error);
                        });
                } else {
                    // 从 localStorage 中读取用户信息
                    user = JSON.parse(userStr);
                    this.checkUserType(user);
                }
            } catch (error) {
                console.log('处理用户信息过程中发生错误:', error);
            }
        },
        checkUserType(user) {
            // 检查用户类型，并设置标志位
            if (user && user.usertype === 1) {
                this.flag = true;
            }
        },
        
    }
})