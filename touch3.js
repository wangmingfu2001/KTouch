/* touch v3.3 by-momo 2016-11-17 */
/* 
�ӿ�˵�� 
	ȫ�ֱ�¶���� touch������Ϊ���󶨵Ķ���(ԭ��)
	
	��ʽ����10����������function��
		start()  move()  tap()  right()
		left()   up()  down()  revert()
		longtap()  end()
	��Ϸ���1��
		swipe(json)  ��������json��
		
	��������󶨼��ٴΰ�
		bind()
		unbind()
		
	���������Ĭ����Ϊ (������Ϊ��ֹ)
	dP()
	
	��ֹ/�ָ�ð��
		noBubble()
		reBubble()
		
	����2��
		this.stop   �� true:ֹͣ��Ĭ��Ϊfalse��
		this.cb   �� true:��ð�ݣ�Ĭ��Ϊfalse��
		
	����˵����Ϊ��ֹios��tap�¼��㴩����ð�ݣ�
	����tap�¼���ֹ����
	e.preventDefault();

 	�ص������Ĳ���˵����
 	start��tap�������ɽ��յ��¼����� e
 	move������������ �ƶ�������{x,y}��ʱ����� e
 	move��������rate�������ƶ�ֵ���������������x��y��������

*/

/* 3.3������ĵ� */
//�޸��˵�������revert�¼������ӱ��������Ĭ����Ϊ

"use strict";
;(function(global,doc,factoryFn){
	var factory = factoryFn(global,doc);
	//window�ӿ�
	window.touch = window.touch || factory;
	//CommonJS�淶�Ľӿ�
	window.define && define(function(require,exports,module){
		return factory;
	});
})(this,document,function(window,document){
	//class-touch
	var Touch = new Function();

	Touch.prototype = {
		version :        '3.3',
		constructor :  Touch,
		hasTouch :  'ontouchstart' in window,

		//ȫ��ð�ݿ���
		cb : false,

		//��ʼ�� [el������Ĵ�����Ԫ��]
		init : function(el){
			if(!el){return;}
			this.EVS = this.hasTouch ? 'touchstart' : 'mousedown';
			this.EVM = this.hasTouch ? 'touchmove' : 'mousemove';
			this.EVE = this.hasTouch ? 'touchend' : 'mouseup';
			this.el = el;
			this.XY = {};              //���������е����꼯��
			this.type = {};           //����� ������Ϊ����
			this.tapTimeOut = null; //tap�ӳٵĶ�ʱ��
			this.longtapTimeOut = null; //long�ӳٵĶ�ʱ��
			this.direction = '';         //�����ƶ��ķ���
			this.firstMove = false;  //�Ƿ��ǵ�һ�λ���(�������û�����ѡ��)
			this.stop = false;          //ֹͣ����
			this.estimate = '';         //�û�Ԥ�ڻ�������洢
			this.preventD = true;   //moveʱ�Ƿ���ֹĬ����Ϊ
			this.el._evs = this.el._evs || null;   //�¼�����
			this.bind();                   //�����¼���
		},

		//�¼���
		bind : function( callback,touchType ){
			var _this = this;
			//�¼��������(������)
			if(!_this.el._evs){
				_this.el._evs = {
					fn_ts : function(e){ _this.ts.call(_this,e) },
					fn_tm : function(e){ _this.tm.call(_this,e) },
					fn_te :  function(e){ _this.te.call(_this,e) }
				};
			}
			_this.el.addEventListener( _this.EVS,_this.el._evs.fn_ts,false );
			_this.el.addEventListener( _this.EVM,_this.el._evs.fn_tm,false );
			_this.el.addEventListener( _this.EVE,_this.el._evs.fn_te,false );
			_this.el.onselectstart = function(){return false;};
			return this;
		},

		//�¼��Ƴ�
		unbind : function(){
			var _this = this;
			_this.el.removeEventListener( _this.EVS,_this.el._evs.fn_ts );
			_this.el.removeEventListener( _this.EVM,_this.el._evs.fn_tm );
			_this.el.removeEventListener( _this.EVE,_this.el._evs.fn_te );
			return this;
		},

		//�����ص�����
		swipe : function( json ){
			typeof(json)=='object' && (this.type = json);
			return this;
		},
		
		//����Ĭ����Ϊ
		dP: function(){
			this.preventD = false;
			 return this;
		 },

		//��ֹð��
		noBubble : function(){
			this.cb = true;
			return this;
		},

		//�ָ�ð��
		reBubble : function(){
			this.cb = false;
			return this;
		},
		//������ʼ
		ts : function(e){
			var _this = this, d = this.XY;
			clearTimeout(_this.longtapTimeOut);

			//���ݴ������Ϊ�󶨣�Ԥ�����û�����
			if(!this.estimate){
				if( this.type.left || this.type.right ){
					this.estimate = 'x';
				}
				if( this.type.up || this.type.down ){
					this.estimate = 'y';
				}
				if(this.type.move && !this.type.left && !this.type.right &&  !this.type.down  && !this.type.up){
					this.estimate = 'm';
				}
			}

			//���û�������
			_this.stop = false;

			//��¼����
			d.x1 = _this.hasTouch ? e.touches[0].pageX : e.clientX;
			d.y1 = _this.hasTouch ? e.touches[0].pageY : e.clientY;

			//ִ��touchstart�¼�
			_this.type['start'] && _this.type['start'].call(_this,e);

			//190�����ִ��tap�¼�
			_this.tapTimeOut = setTimeout(function(){
				_this.type['tap'] && _this.type['tap'].call(_this,e);
				//_this.stop = true;
			},190);

			//900�����ִ��longtap�¼�
			if(_this.type['longtap']){
				e.preventDefault();
				_this.longtapTimeOut = setTimeout(function(){
					_this.type['longtap'].call(_this,e);
					//_this.stop = true;
				},900);
			}

			e.cancelBubble = _this.cb;
			return false;
		},

		//��������
		tm : function(e){
			if(this.stop){return;}
			var _this = this,
			d = this.XY,
			vv = {}, //���ص������
			rate = {}; //���صı��ʻ�׼
			
			//��¼������
			d.x2 = _this.hasTouch ? e.touches[0].pageX : e.clientX;
			d.y2 = _this.hasTouch ? e.touches[0].pageY : e.clientY;

			//�����(move�����Ĳ���)
			vv.x = d.x2 - d.x1;
			vv.y = d.y2 - d.y1;

			//���ʼ���
			rate.y = Number((vv.y * 0.005).toFixed(3));
			rate.y>1 && (rate.y=1);
			rate.y<-1 && (rate.y=-1);

			rate.x = Number((vv.x * 0.005).toFixed(3));
			rate.x>1 && (rate.x=1);
			rate.x<-1 && (rate.x=-1);

			//�����ж�
			if(Math.abs(vv.x)>3 || Math.abs(vv.y)>3){   //�϶��˴��¼�Ϊmove�¼�

				//�Ѿ����������tap�¼�
				clearTimeout(_this.tapTimeOut);
				clearTimeout(_this.longtapTimeOut);

				e.cancelBubble=_this.cb;

				//���ж��û���Ϊ����move
				if( !_this.firstMove ){
					//ƥ���û���ͼ
					switch(_this.estimate){
						case 'x':
							if(Math.abs(vv.x)>Math.abs(vv.y)){
								_this.firstMove = true;
								e.preventDefault();
							}else{
								_this.stop = true;
								return;
							}
							break;
						case 'y':
							if(Math.abs(vv.y)>Math.abs(vv.x)){
								_this.firstMove = true;
								e.preventDefault();
							}else{
								_this.stop = true;
								return;
							}
							break;
						case 'm':
							_this.firstMove = true;
							if(_this.preventD){e.preventDefault();}
							break;
						default:
							break;
					};

				}else{ //�ڶ��ο�ʼ�˶�
					if(_this.preventD){e.preventDefault();}
					_this.type['move'] && _this.type['move'].call(_this,vv,e,rate);
				}

			}else{  //�϶��˴��¼�Ϊ����¼�
				e.preventDefault();
			}
			return false;
		},

		//��������
		te : function(e){
			if(this.stop){return;}

			this.type['end'] && this.type['end'].call(this,e);

			clearTimeout(this.longtapTimeOut);

			//����ʼִ�лص���ʱ�򣬹ر�start �� move
			this.stop = true;

			//λ�ü���
			this.direction = Touch.swipeDirection(this.XY.x1, this.XY.x2, this.XY.y1, this.XY.y2);

			//��ʼ�˶�
			if(this.direction != 'none'){
				if(this.type[this.direction]){
					this.type[this.direction].call(this);
				}else if(this.type['revert']){
					this.type['revert'].call(this);
				}
			}

			//������꼯
			this.XY = {};

			//�ָ�move�ķ���ʶ��
			this.firstMove = false;
		},

		//����transForm
		transForm : function(obj,speed,iTarget,type){
			var ele=obj.style;
			type = type || 'linear';
			speed = speed || 0;
			ele.webkitTransition = ele.transition ='all '+ speed + 'ms '+type;

			iTarget[0]=iTarget[0]+'';
			iTarget[1]=iTarget[1]+'';
			if(iTarget[0].indexOf('px')==-1){iTarget[0]+='px';}
			if(iTarget[1].indexOf('px')==-1){iTarget[1]+='px';}

			ele.webkitTransform =ele.transform ='translateX('+iTarget[0]+') translateY('+ iTarget[1] +') translateZ(0)';
		}
	};

	//��չ����
	['start','end', 'move', 'tap', 'right', 'left', 'up', 'down', 'revert','longtap'].forEach(function(key){
		Touch.prototype[key] = function(callback){
			this.type[key] = callback;
			return this;
		}
	});

	//��������ʶ����
	Touch.swipeDirection=function(x1, x2, y1, y2){
		if(!x2 && !y2){
			return 'none';
		}
		if(Math.abs(x2 - x1) > 50 || Math.abs(y1 - y2) > 50){
			return Math.abs(x1 - x2) >=	Math.abs(y1 - y2) ? (x1 - x2 > 0 ? 'left' : 'right') : (y1 - y2 > 0 ? 'up' : 'down');
		}else{
			return 'revert';
		}
	};

	//init������ԭ��ָ��touch��ԭ��
	Touch.prototype.init.prototype = Touch.prototype;

	//�����������
	return function( el ){
		return new Touch.prototype.init( el );
	};
});