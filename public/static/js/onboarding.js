$(function(){
	$('body').on('click','.LanguageCard__Container',function(){
		$(this).addClass('LanguageCard__Container--selected');
		$('footer button').attr('disabled',false);
		toStep(2);
	});

		$('body').on('click','button',function(){
					var p = $(this).attr('data');
					toStep(p);
				});

})

function toStep(n){
	$.ajax({
			url:"/index/index/ob_step"+n,
			data:'st=1',
			type:'get',
			dataType:'html',
			success:function(dd){
				$('.OnboardingModal').html(dd);
				
				 
			}
		});
}
