# Touch3
touch库3.0 by -momo

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

	阻止冒泡
		noBubble()

	属性1个
		this.stop   【 true:停止，默认为false】



http://wangmingfu2001.github.io/KTouch/