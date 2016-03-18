/* touch v3.0 by-momo 2016-03-18 */
/* 
�ӿ�˵�� 
	ȫ�ֱ�¶���� touch������Ϊ���󶨵Ķ���(ԭ��)
	
	��ʽ����8����������function��
		start()  move()  tap()  right()
		left()   up()  down()  revert()
		
	��Ϸ���1��
		swipe(json)  ��������json��
		
	��������󶨼��ٴΰ�
		bind()
		unbind()
		
	��ֹð��
		noBubble()
		
	����1��
		this.stop   �� true:ֹͣ��Ĭ��Ϊfalse��
*/ 
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
		version :        '3.0',  //3.0�İ�
		constructor :  Touch,
		hasTouch :  'ontouchstart' in window,
		
		//ȫ��ð�ݿ���
		cb : false,

		//��ʼ�� [el������Ĵ�����Ԫ��]
		init : function(el){
			this.EVS = this.hasTouch ? 'touchstart' : 'mousedown';
			this.EVM = this.hasTouch ? 'touchmove' : 'mousemove';
			this.EVE = this.hasTouch ? 'touchend' : 'mouseup';
			this.el = el;
			this.XY = {};              //���������е����꼯��
			this.type = {};           //����� ������Ϊ����
			this.tapTimeOut = null; //tap�ӳٵĶ�ʱ��
			this.direction = '';         //�����ƶ��ķ���
			this.firstMove = false;  //�Ƿ��ǵ�һ�λ���(�������û�����ѡ��)
			this.stop = false;          //ֹͣ����
			this.estimate = '';         //�û�Ԥ�ڻ�������洢
			this.bind();                   //�����¼���
		},
		
		//�¼���
		bind : function( callback,touchType ){
			var _this = this;
			_this.fn_ts = function(e){ _this.ts.call(_this,e) };
			_this.fn_tm = function(e){ _this.tm.call(_this,e) };
			_this.fn_te = function(e){ _this.te.call(_this,e) };
		
			_this.el.addEventListener( _this.EVS,_this.fn_ts,false );
			_this.el.addEventListener( _this.EVM,_this.fn_tm,false );
			_this.el.addEventListener( _this.EVE,_this.fn_te,false );
			_this.el.onselectstart = function(){return false;};
			return this;
		},
		
		//�¼��Ƴ�
		unbind : function(){
			this.el.removeEventListener( this.EVS,this.fn_ts );
			this.el.removeEventListener( this.EVM,this.fn_tm );
			this.el.removeEventListener( this.EVE,this.fn_te );
			return this;
		},
		
		//�����ص�����
		swipe : function( json ){
			typeof(json)=='object' && (this.type = json);
			return this;
		},
		
		//��ֹð��
		noBubble : function(){
			this.cb = true;
			return this;
		},
		
		//������ʼ
		ts : function(e){
			var _this = this, d = this.XY;
			
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
			_this.type['start'] && _this.type['start'].call(_this);
			
			//190�����ִ��tap�¼�
			_this.tapTimeOut = setTimeout(function(){
				_this.type['tap'] && _this.type['tap'].call(_this);
				_this.stop = true;
			},190);
			
			e.cancelBubble = _this.cb;
			return false;
		},
		
		//��������
		tm : function(e){
			if(this.stop){return;}
			var _this = this,
				 d = this.XY,
				 vv = {}; //���ص������
				 
			//��¼������
			d.x2 = _this.hasTouch ? e.touches[0].pageX : e.clientX;
			d.y2 = _this.hasTouch ? e.touches[0].pageY : e.clientY;
			
			//�����(move�����Ĳ���)
			vv.x = d.x2 - d.x1;
			vv.y = d.y2 - d.y1;
			
			//�����ж�
			if(Math.abs(vv.x)>3 || Math.abs(vv.y)>3){   //�϶��˴��¼�Ϊmove�¼�
			
				//�Ѿ����������tap�¼�
				clearTimeout(_this.tapTimeOut);
				
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
							e.preventDefault();
						break;
						default:
						break;
					};
					
				}else{ //�ڶ��ο�ʼ�˶�	
					_this.type['move'] && _this.type['move'].call(_this,vv,e);
				}
				
			}else{  //�϶��˴��¼�Ϊ����¼�
				e.preventDefault();
			}
			return false;
		},
		
		//��������
		te : function(e){
			if(this.stop){return;}
			
			//����ʼִ�лص���ʱ�򣬹ر�start �� move
			this.stop = true;
			
			//λ�ü���
			this.direction = Touch.swipeDirection(this.XY.x1, this.XY.x2, this.XY.y1, this.XY.y2);
			
			//��ʼ�˶�
			if(this.direction && this.type[this.direction]){
				this.type[this.direction].call(this);
			}
			
			//������꼯
			this.XY = {};
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
	['start', 'move', 'tap', 'right', 'left', 'up', 'down', 'revert'].forEach(function(key){
		Touch.prototype[key] = function(callback){
			this.type[key] = callback;
			return this;
		}
	});
	
	//��������ʶ����
	Touch.swipeDirection=function(x1, x2, y1, y2){
		if(Math.abs(x2 - x1) > 30 || Math.abs(y1 - y2) > 30){
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