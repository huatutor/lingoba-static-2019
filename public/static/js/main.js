var loadbundlejs = function(tag){
    if(!tag) return false;
    axios.post('/index/index/getbundlejs',{tag:tag}).then(re=>{
        var script = document.createElement('script');
        // 设置标签的类型
        script.type = 'text/javascript';
        // 设置引入的js文件的路径
        script.src = re.data;
        // 添加标签
        document.getElementsByTagName('head')[0].appendChild(script);
    })
}

var chat = function(userid){
    sessionStorage.setItem('chat',userid);
    window.open('/chat','Chat');
}
var uni_encode = function(string){
    let unicode = '';
    for (let i = 0; i < string.length; i++) {
        unicode += string.charCodeAt(i).toString(16);
    }
    return unicode;
}

var uni_decode = function(unicode){
    let str = '';
    for (let i = 0; i < unicode.length; i += 2) {
        str += String.fromCharCode(parseInt(unicode.substr(i, 2), 16));
    }
    return str;
}

var _geturlvv = function(key){

    var urlAdd = decodeURIComponent(window.location.href);
    var urlIndex = urlAdd.indexOf("?");
    var urlSearch = urlAdd.substring(urlIndex + 1);
    var reg = new RegExp("(^|&)" + key + "=([^&]*)(&|$)", "i");   //reg表示匹配出:$+url传参数名字=值+$,并且$可以不存在，这样会返回一个数组
    var arr = urlSearch.match(reg);
    if(arr != null) {
        return arr[2].replace(/#/g, '');
    } else {
        return "";
    }
 
}

 
var getcookie = function(name) {
    // 获取当前页面的所有 Cookie
    const cookies = document.cookie.split('; '); // 按照分号和空格分割成数组
    let cookieValue = null;

    // 遍历 Cookie 数组，查找目标 Cookie
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].split('='); // 按照等号分割键值对
        if (cookie[0] === name) {
            cookieValue = decodeURIComponent(cookie[1]); // 解码并返回值
            break;
        }
    }

    return cookieValue;
}
// 判断当前页面是否激活
var isactive = function(){
    var bowhidden="hidden" in document?"hidden": "webkithidden" in document?"webkithidden": "mozhidden" in document ?"mozhidden": null;
    var vibchage="visibilitychange" || "webkitvisibilitychange" || "mozvisibilitychange";
    document.addEventListener(vibchage,function (){
            /*ie10+  moz  webkit  默认*/
            if(!document[bowhidden]) /*false*/
            {
                return true;
            }
            else{
                /*true*/
                return false;
            }
    });
}

/**
 * 将数值四舍五入后格式化.
 * @param num 数值(Number或者String)
 * @param cent 要保留的小数位(Number)
 * @param isThousand 是否需要千分位 0:不需要,1:需要(数值类型);
 * @return 格式的字符串,如'1,234,567.45'
 * @type String
 */
function formatNumber(num,cent,isThousand=0) {
    num = num.toString().replace(/\$|\,/g,'');

    // 检查传入数值为数值类型
    if(isNaN(num))
        num = "0";

    // 获取符号(正/负数)
    let sign = (num == (num = Math.abs(num)));

    num = Math.floor(num*Math.pow(10,cent)+0.50000000001);  // 把指定的小数位先转换成整数.多余的小数位四舍五入
    let cents = num%Math.pow(10,cent);              // 求出小数位数值
    num = Math.floor(num/Math.pow(10,cent)).toString();   // 求出整数位数值
    cents = cents.toString();               // 把小数位转换成字符串,以便求小数位长度

    // 补足小数位到指定的位数
    while(cents.length<cent)
        cents = "0" + cents;

    if(isThousand) {
        // 对整数部分进行千分位格式化.
        for (var i = 0; i < Math.floor((num.length-(1+i))/3); i++)
            num = num.substring(0,num.length-(4*i+3))+','+ num.substring(num.length-(4*i+3));
    }

    if (cent > 0)
        return (((sign)?'':'-') + num + '.' + cents);
    else
        return (((sign)?'':'-') + num);
}

// Generate a random uuid
function generateUUID() {
    var d = new Date().getTime();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
        d += performance.now(); //use high-precision timer if available
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (d + Math.random() * 16) % 16 | 0;
        d = Math.floor(d / 16);
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

function copyTextToClipboard(text) {
      var textArea = document.createElement("textarea");

      //
      // *** This styling is an extra step which is likely not required. ***
      //
      // Why is it here? To ensure:
      // 1. the element is able to have focus and selection.
      // 2. if the element was to flash render it has minimal visual impact.
      // 3. less flakyness with selection and copying which **might** occur if
      //    the textarea element is not visible.
      //
      // The likelihood is the element won't even render, not even a
      // flash, so some of these are just precautions. However in
      // Internet Explorer the element is visible whilst the popup
      // box asking the user for permission for the web page to
      // copy to the clipboard.
      //

      // Place in the top-left corner of screen regardless of scroll position.
      textArea.style.position = 'fixed';
      textArea.style.top = 0;
      textArea.style.left = 0;

      // Ensure it has a small width and height. Setting to 1px / 1em
      // doesn't work as this gives a negative w/h on some browsers.
      textArea.style.width = '2em';
      textArea.style.height = '2em';

      // We don't need padding, reducing the size if it does flash render.
      textArea.style.padding = 0;

      // Clean up any borders.
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';

      // Avoid flash of the white box if rendered for any reason.
      textArea.style.background = 'transparent';


      textArea.value = text;

      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        var successful = document.execCommand('copy');
        var msg = successful ? 'successful' : 'unsuccessful';
        console.log('Copying text command was ' + msg);
      } catch (err) {
        console.log('Oops, unable to copy');
      }

      document.body.removeChild(textArea);
}

let lastTime_352 = 0;
const notificationInterval = 5 * 60 * 1000; // 5分钟的毫秒数

function showNotification(message) {
  const currentTime = Date.now();
  if (currentTime - lastTime_352 > notificationInterval) {
    lastTime_352 = currentTime;

    if (Notification.permission === "granted") {
      const options = {
        body: message,
      };
      new Notification("WebSocket消息", options);
    } else if (Notification.permission !== "denied") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          showNotification(message);
        }
      });
    }
  }
}

function addOneSecond(timeStr) {
    // 将时间字符串转换为日期对象
    var time = new Date(timeStr);
    // 在日期对象上加一秒
    time.setSeconds(time.getSeconds() + 1);
    
    // 格式化日期为字符串，确保格式为 YYYY-MM-DD HH:mm:ss
    var formattedTime = time.toISOString().slice(0, 19).replace('T', ' ');

    return formattedTime;
}


$(function(){
	setTimeout(() => {
        $('ul').on('mouseenter','.dropdown',function(){
            if (!$(this).hasClass('coursemenu')) {
                $(this).addClass('open');
            }
        });
        $('ul').on('mouseleave','.dropdown',function(){
            if (!$(this).hasClass('coursemenu')) {
                $(this).removeClass('open');
            }
        });
    }, 2000);
	
	 
    // set_timezone();
 


  // 阅读更多
 $('.row').on('click','.more',function(){
 	var obj = $(this).prev();
  // console.log(obj);  
 	obj.css('max-height','').css('height','none');
 	$(this).remove();
 	 
 })

 
$(function(){
    $('body').on('mouseenter','.tips',function(){
        tippy('.tips', {
            content(reference) {
                return reference.getAttribute('data-tip');
            },
        });
            // console.log(X+' '+Y);
    });
    $('body').on('mouseleave','.tips',function(){
        $('#flag-tooltip').remove();
    })
})

 $('#app').on('click','.dropdown-toggle',function(e){
      $('.open').removeClass('open');
      $(this).parent().addClass('open');
    });

 $(document).on('click',function(e){
       var _con = $('.dropdown-toggle');   // 设置目标区域
          if(!_con.is(event.target) && _con.has(event.target).length === 0){ // Mark 1
            //$('#divTop').slideUp('slow');   //滑动消失
            $('.open').removeClass('open');          //淡出消失
          }
    });


  
 
  
//判断Email格式是否正确
function emailFormatCheck(email){
    if ((email.length > 128) || (email.length < 6)) {
        return false;
    }
    var format = /^[A-Za-z0-9+]+[A-Za-z0-9\.\_\-+]*@([A-Za-z0-9\-]+\.)+[A-Za-z0-9]+$/;
    if (!email.match(format)) {
    return false;
    }
     
    return true;
     
}


})