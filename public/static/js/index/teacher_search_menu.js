 
var timemenu = ({
	template:'#tmp_cala',
	data(){
		return{ ta:{
				'sunrise':{text:LANG.teacher.sunrise,class:'',icon:'/static/img/icons8-partly_cloudy_day.svg'},
				'morning':{text:LANG.teacher.morning,class:'',icon:'/static/img/icons8-sunrise.svg'},
				'afternoon':{text:LANG.teacher.afternoon,class:'',icon:'/static/img/icons8-sun.svg'},
				'evening':{text:LANG.teacher.evening,class:'',icon:'/static/img/icons-diy-night.svg'},
			},
			wks:{
			'sunday':{text:LANG.index.week_7,class:''},
			'monday':{text:LANG.index.week_1,class:''},
			'tuesday':{text:LANG.index.week_2,class:''},
			'wednesday':{text:LANG.index.week_3,class:''},
			'thursday':{text:LANG.index.week_4,class:''},
			'friday':{text:LANG.index.week_5,class:''},
			'saturday':{text:LANG.index.week_6,class:''},
		}}
	},
	props:['pleft','parms'],
	mounted(){
		if(this.parms){
			let vo;
			for(idx in this.parms){
				 vo = this.parms[idx];
				if(this.wks[vo]){
					this.wks[vo].class =  'active' ;
				}
				if(this.ta[vo]){
					this.ta[vo].class =  'active' ;
				}
			}
		}
		setTimeout(()=>{
			v_smenu.ismenu = false;
		},200)
		 
	},
	methods:{
		check(idx){
			var txt;
			if(this.wks[idx]){
				this.wks[idx].class = this.wks[idx].class == '' ? 'active' : '';
				txt = this.wks[idx].text;
			}
			if(this.ta[idx]){
				this.ta[idx].class = this.ta[idx].class == '' ? 'active' : '';
				txt = this.ta[idx].text;
			}
			
			Vtmp.$emit('menuclick',{tag:'time',idx:idx,text:txt})
			 
		}
	}
})
var ltype = ({
	template:'#tmp_ltype',
	props:['pleft','parms'],
	data(){ 
		return{ ltypes:{
			// free,trial,private,group
				'free':{text:LANG.teacher.free_lesson,class:''},
				'trial':{text:LANG.teacher.trial_lesson,class:''},
				'private':{text:LANG.teacher.private_lesson,class:''},
				'group':{text:LANG.teacher.group_lesson,class:''}
				
			}, tags:{},ctype:[],activeTags: []

			 }
	},
	mounted(){
		 
		setTimeout(()=>{
			v_smenu.ismenu = false;
			this.handleParmsChange();
		},200)
		
		// console.log(this.parms,this.pleft,8200) 
		this.gettags();
		 
	},
	methods:{
		gettags() {
				// 检查 sessionStorage 中是否已经存在 tags 和 ctype 数据
				const cachedTags = sessionStorage.getItem('tags');
				const cachedCtype = sessionStorage.getItem('ctype');

				if (cachedTags && cachedCtype) {
					// 如果存在，直接使用缓存的数据
					this.tags = JSON.parse(cachedTags);
					this.ctype = JSON.parse(cachedCtype);
				} else {
					// 如果不存在，从服务器获取数据
					axios.post('/index/index/getcoursetypelist').then(re => {
						this.tags = re.data.tags;
						this.ctype = re.data.ctype;

						// 将获取的数据存储到 sessionStorage 中
						sessionStorage.setItem('tags', JSON.stringify(this.tags));
						sessionStorage.setItem('ctype', JSON.stringify(this.ctype));
					}).catch(error => {
						console.log('Error fetching tags and ctype:', error);
					});
				}
			},
		// 切换激活状态
        toggleActive(tag) {
            const index = this.activeTags.indexOf(tag);
            if (index === -1) {
                // 如果不存在，则添加到数组
                this.activeTags.push(tag);
            } else {
                // 如果存在，则从数组中移除
                this.activeTags.splice(index, 1);
            }
        },
        // 判断当前元素是否激活
        isActive(tag) {
            return this.activeTags.includes(tag);
        },
	     check(idx){
			this.ltypes[idx].class = this.ltypes[idx].class == '' ? 'CustomCheckbox--checked' : '';
			this.toggleActive(idx);
	     	Vtmp.$emit('menuclick',{tag:'ltype',idx:idx,text:this.ltypes[idx].text})
	     	 
	     },
		 isActive(idx) {
			return this.parms.includes(idx);
		},
		 handleParmsChange() {
			let vo;
			for (let idx in this.parms) {
				vo = this.parms[idx];
			// 假设 ltypes 是一个数组，且 vo 是 ltypes 的索引
				if (this.ltypes[vo]) {
					this.$set(this.ltypes[vo], 'class', 'CustomCheckbox--checked');
				}
			}
			this.$forceUpdate();
		}
	},
	 
})
var speak = ({
	template:'#tmp_speak',
	props:['pleft','parms'],
	data(){ 
		return{ speaks:{}, tags:{},ctype:[],checked: []

			 }
	},
	mounted(){
		
		setTimeout(()=>{
			v_smenu.ismenu = false;
			 
		},200)
		console.log(this.parms,this.pleft,8200) 
		this.getlanglist();
		 
	},
	methods:{
		getlanglist() {
				// 检查 sessionStorage 中是否已经存在语言列表数据
				const cachedLangList = sessionStorage.getItem('langList');

				if (cachedLangList) {
					// 如果存在，直接使用缓存的数据
					const res = JSON.parse(cachedLangList);
					this.speaks = Object.entries(res).reduce((acc, [key, value]) => {
						acc[key] = { text: value.cnName, en: value.enName, class: '', flag: value.flag };
						return acc;
					}, {});
					console.log(res, this.speaks);
				} else {
					// 如果不存在，从服务器获取数据
					axios.post('/index/index/getlanguagelist').then(re => {
						let res = re.data;
						// 定义排序规则：中文和英文排在最前面，其他语言按字母顺序排列
						const sortedEntries = Object.entries(re.data).sort(([keyA], [keyB]) => {
							if (keyA === 'zh') return -1; // 中文排在最前面
							if (keyB === 'zh') return 1;
							if (keyA === 'en') return -1; // 英文排在第二
							if (keyB === 'en') return 1;
							return keyA.localeCompare(keyB); // 其他语言按字母顺序排列
						});

						this.speaks = Object.entries(re.data).reduce((acc, [key, value]) => {
							acc[key] = { text: value.cnName, en: value.enName, class: '', flag: value.flag };
							return acc;
						}, {});

						// 将获取的数据存储到 sessionStorage 中
						sessionStorage.setItem('langList', JSON.stringify(res));

						console.log(res, this.speaks);
					}).catch(error => {
						console.log('Error fetching language list:', error);
					});
				}
			},
	    check(idx){
			 
			this.checked.push(idx);
	     	Vtmp.$emit('menuclick',{tag:'speak',idx:idx,text:this.speaks[idx].text})
	     	 
	     },
		 isActive(idx){
			return this.parms.includes(idx);
		 }
	}
})
var other = ({
	template:'#tmp_other',
	props:['pleft','parms'],
	data(){
		return{ sks:{},offsetY:{},mv:{} ,offsetYc:{},keyword:''}
	},
	mounted(){
		this.getskills();
		setTimeout(()=>{
			v_smenu.ismenu = false;
		},200)
		
		  
	},
	methods:{
	     getskills(){
	     	axios.post('/index/index/getskills').then(re=>{
	     		// console.log(re);
	     		this.sks = re.data;
	     		if(this.parms){
				 	let vo;
					for(idx in this.parms){
						vo = this.parms[idx];
						for(aa in this.sks){
							for(bb in this.sks[aa]){
								if(this.sks[aa][bb].id == vo){
									this.sks[aa][bb].class = "CustomCheckbox--checked"
								}
							}
						}
					}
				}

	     	})
	     },

	     check(idx,ix){
			let obj = this.sks[idx];
			obj[ix].class = obj[ix].class == '' ? 'CustomCheckbox--checked' : '';
	     	Vtmp.$emit('menuclick',{tag:'other',idx:obj[ix].tag,text:obj[ix].title});
	     	 
	     },
	     search(){
	     	if(!this.keyword)return false;
	     	Vtmp.$emit('menuclick',{tag:'search',idx:'key',text:this.keyword});
	     },
	     scroll(){
	     	let t0 = 176.5;
	     	let t = $('.FilterList').offset().top;
	     	let hh = $('.FilterList').height();
	     	let i0 = (hh - 375) / 208;
	     	let e0 = 176.5 /i0;
	     	let yy = (0-t)/i0 + e0;
	     	this.offsetY = {'transform':"translateY("+yy+"px)"};
	     	// console.log(this.offsetY)
	     },
	     scrollbar(ev){
				     	    		  //拖拽----------------------------------------------
			    var scroller = document.getElementById('scrollbar');
			    var p = document.getElementById('con');
			    var oBox = document.getElementById('box');
			    
			     var dis_p = p.offsetHeight - oBox.offsetHeight; //p的高度减去box的高度 //1054
			    var dis_span = oBox.offsetHeight - scroller.offsetHeight; //滑块移动距离 //208
			     
			        ev = ev || window.event;
			        var mt = ev.clientY - scroller.offsetTop; //只取Y方向
			        document.onmousemove = function(ev) {
			            ev = ev || window.event;
			            var t = ev.clientY - mt;
			            // console.log(t,'00')
			            if (t <= 0) t = 0; //限制顶部位置
			            if (t >= 208) t = 208; //限制底部位置
			            // console.log(t,'01')
			            //计算移动比率
			            move_rate = t / dis_span;
			            p.style.top = -dis_p * move_rate + 'px'; //移动比率
			            scroller.style.top = t + 'px';
			        };
			        document.onmouseup = function() {
			            document.onmousemove = null;
			        };
			        return false; //阻止选中文字
			     
	     }
	      
	}
})

var search = ({
	template:'#tmp_search',
	props:['pleft','parms'],
	data(){
		return{keyword:""}
	},
	mounted(){
		this.$refs.secc.focus();
		if(Array.isArray(this.parms)){
			this.keyword = this.parms[0];
		}else{
			this.keyword = this.parms;
		}	
		
		setTimeout(()=>{
			v_smenu.ismenu = false;
		},200)
		 
	},
	methods:{
	   submit(){
	   		if(!this.keyword) return false;
	   		// if(!this.keyword) return false;
	   		Vtmp.$emit('menuclick',{tag:'search',text:this.keyword})
	   }  
	},
	 
})
var v_smenu = new Vue({
	el:'#searchmenu',
	data:{show:{timemenu:false,kemu:false,ltype:false,speak:false,other:false,search:false},
			parms:{
				timemenu:[],kemu:[],ltype:[],speak:[],other:[],search:[]
			},ismenu:false,tmp_km:{},
			postion: {},
		},
	components:{
		'timemenu':timemenu,
		'ltype' : ltype,
		'speak' : speak,
		'other' : other,
		'search' : search,
	},
	mounted(){
		Vtmp.$on('showm',re=>{
			this.showsmenu(re.id);
			// console.log(re,487);
			this.postion = {"left":re.left+"px","top":re.top+"px"};
			this.parms = re.parms;
		})
		Vtmp.$on('clearmenu',re=>{
			for(vx in this.show){
				this.show[vx] = false;
			}
			Vtmp.$emit('menuclass','clear');
		})
		Vtmp.$on('parms',re=>{
			this.parms = re;
		})
		Vtmp.$on('checkedxd',re=>{
			this.tmp_km = re;
		})
		Vtmp.$on('removeso',re=>{
			if(re=='all'){
				this.clear();
			}else{
				this.removeValue(re);
			}
			console.log(re,7000)
			Vtmp.$emit('removexx',this.parms);
		})
	},
	methods:{
		showsmenu(cat){
			let _cat = this.show[cat];
			for(vx in this.show){
				this.show[vx] = false;
			}
			this.show[cat] = !_cat;
			let mark = _cat ? 'clear' : 'show';
			Vtmp.$emit('menuclass',mark);
			this.ismenu = _cat ? false : true; //点击空白处关闭menu
		},
		clear(){
			this.parms = {
				timemenu:[],kemu:[],ltype:[],speak:[],other:[],search:[]
			}
		},
		removeValue(value) {
			// 遍历 this.parms 的每个键
			for (const key in this.parms) {
				if (Array.isArray(this.parms[key])) {
					// 如果值是数组，则检查是否包含目标值
					const index = this.parms[key].indexOf(value);
					if (index !== -1) {
						// 移除目标值
						this.parms[key].splice(index, 1);
					}
				}
			}
		}
		
	}
})