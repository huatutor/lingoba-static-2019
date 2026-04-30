$(function(){
	 
	var args = location.href.split('/');
	var altid = args[args.length - 1];
 
	// $('.list-unstyled li').removeClass('selected');
// 	$('.MiniSidebar').find('img').each(function(){

// 		if($(this).attr('alt') == altid){
// 		    $(this).parent().addClass('selected')
// 		}
// 	});

// // 子菜单
// 	$('.MiniSidebar').find('img').parent().click(function(){
// 	  var id = $(this).find('img').attr('alt');
// 	  var obj = $(this).parent();
// 	  var murl = new Array()
// 	  	murl['profile'] = '/student/settings/profile';
// 		murl['avatar'] = '/student/settings/avatar';
// 		murl['language'] = '/student/settings/language';
// 		murl['password'] = '/student/settings/password';
// 		murl['invite'] = '/student/settings/invite';
// 		murl['alert'] = '/student/settings/alert';
// 		murl['payment'] = '/student/settings/payment';
// 		murl['refills'] = '/student/settings/refills';
	  	 
// 	  location.href=murl[id];
// 	});

//mouse hover
 $('.form-group').hover(function(){
 	var tips=new Array();
 	tips['email'] = ['电子邮箱','添加您的电子邮箱，这样一学90可以通知您即将到来的课和重要更新。'];
	tips['realname'] = ['名字','输入您的名字。'];
	tips['realname'] = ['姓氏','可选。输入您的姓氏。'];
	tips['birthday'] = ['出生日期','可选。添加您的出生日期'];
	tips['wechat'] = ['微信','可选。添加您的微信号码']; 
	tips['country'] = ['国家','输入您当前所在的国家'];
	tips['gender'] = ['性别','选择您的性别（可选）'];
	tips['timezone'] = ['时区','输入您的时区。'];
	tips['classin'] = ['客户端账号','输入您注册的客户端账号。'];
	tips['timesystem'] = ['时钟','请选择告诉您时间的首选方法'];
	tips['mobile'] = ['电话','可选。添加您的手机号码，这样我们可以给您发送短信，通知即将到来的课和重要更新。'];
	tips['new_password'] = ['新密码','输入新密码'];
	tips['confirm_password'] = ['确认新密码','确认您的新密码'];

	var id = $(this).attr('data-tips');
	if(!id) return ;
	// $('.col-sm-3 strong').text(tips[id][0]);
	// $('.col-sm-3 strong').parent().next().text(tips[id][1]);
 })
})

 


 
 
 
 