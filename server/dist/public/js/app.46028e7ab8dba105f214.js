webpackJsonp([2,0],{0:function(e,t,n){"use strict";function s(e){return e&&e.__esModule?e:{"default":e}}var i=n(61),a=s(i),o=n(59),r=s(o);new a["default"]({el:"body",components:{App:r["default"]}})},9:function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n="connect",s="disconnect",i="LOGIN",a="LOGIN_RESULT",o="TEST_PI",r="MOVE_SLIDES",l="RECEIVE_MESSAGE",c="PUSH_UNREAD_MESSAGE",u="DECAY",d="SEND_MESSAGE",p="READ_MESSAGE";t.CONNECT=n,t.DISCONNECT=s,t.LOGIN=i,t.LOGIN_RESULT=a,t.TEST_PI=o,t.MOVE_SLIDES=r,t.MESSAGE=l,t.PUSH_UNREAD_MESSAGE=c,t.DECAY=u,t.SEND_MESSAGE=d,t.READ_MESSAGE=p},25:function(e,t){"use strict";Object.defineProperty(t,"__esModule",{value:!0});var n="/ALBUM",s="/VASE";t.NS_ALBUM=n,t.NS_VASE=s},26:function(e,t,n){"use strict";function s(e){return e&&e.__esModule?e:{"default":e}}Object.defineProperty(t,"__esModule",{value:!0});var i=n(49),a=s(i),o=n(60),r=s(o),l=n(25),c=n(9),u=n(54),d=s(u),p=n(55),h=s(p);t["default"]={ready:function(){var e=this;this.socket=new a["default"](l.NS_ALBUM),this.socket.on(c.CONNECT,function(){var t=localStorage.getItem("userName");t&&(e.userName=t,e.login())}),this.socket.on(c.LOGIN_RESULT,function(t){t.state?(e.userType=t.userType,localStorage.clear(),localStorage.setItem("userName",e.userName),e.loginSuccess=!0,e.$nextTick(function(){e.$refs.carousel.setData(e.images,e.userType,e.userName,e.socket)})):console.warn(t.info)})},components:{Carousel:r["default"]},socket:null,data:function(){return{loginSuccess:!1,userName:null,userType:null,images:[{components:[h["default"],d["default"]],msg:""}]}},methods:{login:function(){this.userName&&this.userName.length&&this.socket.emit(c.LOGIN,{userName:this.userName,roomName:"design-thinking"})}}}},27:function(e,t,n){"use strict";function s(e){return e&&e.__esModule?e:{"default":e}}Object.defineProperty(t,"__esModule",{value:!0});var i=n(43),a=s(i),o=n(9);t["default"]={ready:function(){this.hammer=new a["default"](this.$els.wraper),this.hammer.on("swipeleft swiperight panleft panright panend pancancel",this.hammerHandler)},socket:null,hammer:null,data:function(){return{userType:null,userName:null,currentSlideIndex:0,images:[],imageComponentsStyle:[],imagesCount:0,wraperTransition:{transition:!0},carouselWraperStyle:{left:"0%",width:0},slideWidth:0,unReadMessage:[],panBoundaryRatio:.25}},methods:{setData:function(e,t,n,s){var i=this;this.socket=s,this.socket.on(o.MOVE_SLIDES,this.setCurrentSlide),this.socket.on(o.DECAY,this.handleDecay),this.userType=t,this.userName=n,this.images=e,this.images.forEach(function(e,t){var n=[];e.components.forEach(function(e){n.push({opacity:1,backgroundImage:"url("+e+")"})}),i.imageComponentsStyle.push(n)}),this.imagesCount=this.images.length,this.carouselWraperStyle.width=100*this.imagesCount+"%",this.$nextTick(function(){i.slideWidth=i.$els.wraper.clientWidth/i.imagesCount})},setCurrentSlide:function(e){this.currentSlideIndex=e,this.carouselWraperStyle.left=-100*this.currentSlideIndex+"%"},moveSlides:function(e){var t=this,n=arguments.length<=1||void 0===arguments[1]||arguments[1];this.wraperTransition.transition=n,this.$nextTick(function(){t.setCurrentSlide(e)}),this.socket.emit(o.MOVE_SLIDES,e)},handleDecay:function(e){console.log(e),this.imageComponentsStyle[0][0].opacity=.01*e},hammerHandler:function(e){switch(e.type){case"swipeleft":case"swiperight":this.handleSwipe(e);break;case"panleft":case"panright":case"panend":case"pancancel":this.handlePan(e)}},handleSwipe:function(e){switch(e.direction){case 4:this.currentSlideIndex>0&&--this.currentSlideIndex;break;case 2:this.currentSlideIndex<this.imagesCount-1&&++this.currentSlideIndex}this.moveSlides(this.currentSlideIndex),this.hammer.stop(!0)},handlePan:function(e){switch(e.type){case"panleft":case"panright":var t=this.carouselWraperStyle.left.slice(0,-1),n=100*(this.imagesCount-1);(0===this.currentSlideIndex&&t>=0||this.currentSlideIndex===this.imagesCount-1&&t<=n)&&(e.deltaX*=.2),this.wraperTransition.transition=!1,this.carouselWraperStyle.left=-100*(this.currentSlideIndex-e.deltaX/this.slideWidth)+"%";break;case"panend":case"pancancel":Math.abs(e.deltaX)>this.slideWidth*this.panBoundaryRatio&&(e.deltaX>0?this.currentSlideIndex>0&&--this.currentSlideIndex:this.currentSlideIndex<this.imagesCount-1&&++this.currentSlideIndex),this.moveSlides(this.currentSlideIndex)}}}}},41:function(e,t){},42:function(e,t){},54:function(e,t,n){e.exports=n.p+"image/f1.5aeb7c2.png"},55:function(e,t,n){e.exports=n.p+"image/f2.9036186.png"},57:function(e,t){e.exports='<div class=carousel _v-6b753e81=""> <ol class=carousel-indicators _v-6b753e81=""> <li v-for="image in images" :class="{active: $index===currentSlideIndex }" @click=moveSlides($index) _v-6b753e81=""></li> </ol> <div class=carousel-inner _v-6b753e81=""> <div class=carousel-wraper :class=wraperTransition :style=carouselWraperStyle v-el:wraper="" _v-6b753e81=""> <div v-for="(imageIndex, image) in images" class=image :class="{active:$index === currentSlideIndex}" :style="{\nwidth: `${100 /imagesCount}%`\n            }" _v-6b753e81=""> <div v-for="(componentIndex,componentSrc) in image.components" class=image-component :style=imageComponentsStyle[imageIndex][componentIndex] _v-6b753e81=""> <p _v-6b753e81="">{{image.msg}}</p> </div> </div> </div> </div> <ul id=messages _v-6b753e81=""> <li v-for="msg in unReadMessage" _v-6b753e81="">{{msg.content}}</li> </ul> </div>'},58:function(e,t){e.exports="<div id=app> <carousel v-if=loginSuccess v-ref:carousel></carousel> <div v-else class=btn-chose-type> <input type=text v-model=userName /> <button @click=login>login</button> </div> </div>"},59:function(e,t,n){var s,i;n(41),s=n(26),i=n(58),e.exports=s||{},e.exports.__esModule&&(e.exports=e.exports["default"]),i&&(("function"==typeof e.exports?e.exports.options||(e.exports.options={}):e.exports).template=i)},60:function(e,t,n){var s,i;n(42),s=n(27),i=n(57),e.exports=s||{},e.exports.__esModule&&(e.exports=e.exports["default"]),i&&(("function"==typeof e.exports?e.exports.options||(e.exports.options={}):e.exports).template=i)},63:function(e,t){}});
//# sourceMappingURL=app.46028e7ab8dba105f214.js.map