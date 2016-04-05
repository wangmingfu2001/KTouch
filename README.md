# Touch3
touch库3.1 by -momo

接口说明
	全局暴露函数 touch，参数为被绑定的对象(原生)

	链式方法8个【参数是function】
		start()  move()  tap()  right()
		left()   up()  down()  revert()
		
	混合方法1个
		swipe(json)  【参数是json】
		
	解除滑动绑定及再次绑定
		bind()
		unbind()
		
	阻止/恢复冒泡
		noBubble()
		reBubble()
		
	属性2个
		this.stop   【 true:停止，默认为false】
		this.cb   【 true:不冒泡，默认为false】
	
		
其他说明
	为防止ios的tap事件点穿（非冒泡）
	请在tap事件里，手工添加
	e.preventDefault();


回调函数的参数说明：
 	start和tap方法，可接收到事件对象 e
 	move方法，参数有 移动的坐标{x,y}和时间对象 e


http://wangmingfu2001.github.io/KTouch/
