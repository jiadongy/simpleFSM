/**
 * Created by FeiyuLab on 2014/11/26 0026.
 */
"use strict";
(function(window,undefined){
    /**
     * 嵌套IF，判断是否有AMD规范
     */
    (function(factory){
        if ( typeof define === 'function' && define.amd ) {
            // Define as an AMD module if possible
            define( factory );
        }else  {
            factory( window ,true);
        }
        /**
         * noGlobal用于判断是否注册到Window
         */
    }(function(window,noGlobal){
        var fsmClass={ASYNC:"FLAG_ASYNC"},
            cache={},//用$id管理实例的私有属性
            debug = true,
            FSMclasses={},//所有FSM类
            FSMinitSettings={}//FSM类对应的initial属性
        /******************************FSM基类*****************************************************/
        function BaseFSM(){
            this.current="none"
        }
        BaseFSM.prototype={
            constructor:BaseFSM,
            transition:function(){
                var tmpcache=cache[this.$id]
                if(tmpcache.isAsync){
                    log("Start Async Transiton")
                    tmpcache.beginStateChange()
                }
            },
            cancel:function(){
                var tmpcache=cache[this.$id]
                if(tmpcache.isAsync){
                    log("Cancel Async Waiting")
                    tmpcache.isAsync=false
                    tmpcache.beginStateChange=null;
                }
            },
            is:function(state){
                return this.current === state
            },
            can:function(eventName){
                return getToByFrom(this[eventName].path,this.current) !== undefined
            },
            cannot:function(eventName){
                return !this.can(eventName)
            }
        }
        /****************************************************************************************/
        /**
         * 由settingObj生成继承FSM基类的用户自定义FSM类
         * @param settingObj
         * @returns {UserFSM}
         */
        function createUserFSM(settingObj){
            var UserFSM=function(stateInit){
                BaseFSM.call(this)
                stateInit && (this.current = stateInit)
            }
            inheritFromSuperType(UserFSM,BaseFSM)
            each(settingObj.callbacks,function(name,callback){
                UserFSM.prototype[name]=callback
            })
            each(settingObj.events,function(i,event){
                UserFSM.prototype[event.name]=UserFSM.prototype[event.name]||buildEventFunction(UserFSM,event)
                UserFSM.prototype[event.name].path= UserFSM.prototype[event.name].path||[]
                UserFSM.prototype[event.name].path.push({from:event.from,to:event.to})
            })
            UserFSM.error = settingObj.error || printError
            return UserFSM;
        }

        /**
         * 遍历路径，找到from对应的to
         * @param pathInfo
         * @param from
         * @returns {*}
         */
        function getToByFrom(pathInfo,from){
            var finalTo
            each(pathInfo,function(i,path){
                if(typeof path.to == "string" && path.to !== "*"){
                    if(path.from instanceof Array){
                        finalTo = path.from.indexOf(from) != -1 ?path.to:finalTo
                        if(finalTo) return false;
                    }else if(path.from == "*" || path.from === from){
                        finalTo = path.to
                        return false;
                    }
                }
            })
            return finalTo
        }

        /**
         * 用户自定义的状态变迁事件都会调用此函数，如果调用非法则抛出错误
         * @param FSM
         * @param event
         * @returns {Function}
         */
        function buildEventFunction(FSM,event){
            return function(otherArguments){
                try{
                    if(cache[this.$id].isAsync)
                        throw "DisAllow this Method When Async"
                    else if(this.cannot(event.name))
                        throw "DisAllow this Method In Current State "+this.current
                    else
                        eventExecuter(this,FSM, event,otherArguments)
                }catch (e){
                    FSM.error(event.name,null,null,null,null,e)
                }

            }
        }

        /**
         * 状态变迁事件的核心函数，依次触发所有callback，并处理异步和取消事件的特殊情况
         * @param FSMInstance
         * @param FSMClass
         * @param event
         * @param finalTo
         * @param otherArguments
         */
        function eventExecuter(FSMInstance,FSMClass,event,finalTo,otherArguments){
            var name=event.name,path=FSMClass.path,from=FSMInstance.current,to=finalTo,prototype=FSMClass.prototype,
                canContinueEvent=true,useAsync=false,tmpFlag,tmpcache=cache[FSMInstance.$id],
                onbeforeE=prototype["onbefore"+name],
                onafterE=prototype["on"+name] || prototype["onafter"+name],
                onleaveS=prototype["onleave"+from],
                onenterS=prototype["onenter"+to] || prototype["on"+to],
                onbeforeEAll=prototype["onbeforeevent"],
                onafterEAll=prototype["onevent"] || prototype["onafterevent"],
                onleaveSAll=prototype["onleaveevent"],
                onenterSAll=prototype["onstate"] || prototype["onenterstate"],
                realArguments=[name, from,to].concat(otherArguments)
            if(isFunction(onbeforeE)){
                tmpFlag=onbeforeE(realArguments)
                tmpFlag===false && (canContinueEvent=false)
                tmpFlag===fsmClass.ASYNC && (useAsync=useAsync||true)
                log("execute onBefore "+name);
            }
            if(isFunction(onbeforeEAll)){
                onbeforeEAll(realArguments)
                log("execute onBeforeEvent");
            }
            if(isFunction(onleaveS)){
                tmpFlag=onleaveS(realArguments)
                tmpFlag===false && (canContinueEvent=false)
                tmpFlag===fsmClass.ASYNC && (useAsync=useAsync||true)
                log("execute onLeave "+from);
            }
            if(isFunction(onleaveSAll)){
                onleaveSAll(realArguments)
                log("execute onLeaveState");
            }
            if(useAsync===false)
                beginStateChange()
            else{
                tmpcache.isAsync=true
                tmpcache.beginStateChange=beginStateChange
                log("Async : waiting for Manual Transition()");
            }
            function beginStateChange(){
                if(canContinueEvent){
                    FSMInstance.current = to
                    if(isFunction(onenterS)){
                        onenterS(realArguments)
                        log("execute onEnterState "+to);
                    }
                    if(isFunction(onenterSAll)){
                        onenterSAll(realArguments)
                        log("execute onEnterState");
                    }
                    if(isFunction(onafterE)){
                        onafterE(realArguments)
                        log("execute onAfter "+name);
                    }
                    if(isFunction(onafterEAll)){
                        onafterEAll(realArguments)
                        log("execute onAfterEvent");
                    }
                }
                useAsync=false
                tmpcache.isAsync=false
                tmpcache.beginStateChange=null
            }
        }

        /**
         * 默认的Exception处理函数
         * @param eventName
         * @param from
         * @param to
         * @param args
         * @param errorCode
         * @param errorMessage
         */
        function printError(eventName, from, to, args, errorCode, errorMessage){
            log('Exception catched : when execute event ' + eventName + ' : '
                + errorMessage)
        }

        /**
         * 创建FSM，有4种重载形式
         *  create(settingObj)
         *  create(settingObj,ClassName)
         *  create(settingObj,ClassName,onlyClass)
         *  create(ClassName)
         * @returns {null}
         */
        fsmClass.create = function () {
            var createFromExistedFSMClass,settingObj,FSMName,hasParamErr=true,createClassOnly=false
            if(arguments.length==3 && typeof arguments[0] === "object"
                && typeof arguments[1] === "string" && typeof arguments[2] === "boolean"){
                createFromExistedFSMClass=false
                settingObj=arguments[0]
                FSMName=arguments[1]
                createClassOnly=arguments[2]
                hasParamErr=false
            }
            if(arguments.length==2 && typeof arguments[0] === "object" && typeof arguments[1] === "string"){
                createFromExistedFSMClass=false
                settingObj=arguments[0]
                FSMName=arguments[1]
                hasParamErr=false
            }else if(arguments.length === 1){
                switch (typeof arguments[0]){
                    case "object":
                        createFromExistedFSMClass=false;
                        settingObj=arguments[0]
                        hasParamErr=false
                        break;
                    case "string":
                        if(FSMclasses[arguments[0]] !== undefined){
                            createFromExistedFSMClass=true
                            FSMName=arguments[0]
                            settingObj={initial:FSMinitSettings[FSMName]}
                            hasParamErr=false
                        }
                        break;
                }
            }
            if(hasParamErr) {log("FSM.create : error in params") ; return null}
            var userfsmConstructor = createFromExistedFSMClass?FSMclasses[FSMName]:createUserFSM(settingObj),
                complexInitial = typeof settingObj.initial === "object",
                initialState = complexInitial?settingObj.initial.state:settingObj.initial,
                startupEvent = complexInitial?userfsmConstructor.prototype[settingObj.initial.event]:undefined,
                userfsmInstance = createClassOnly?null:new userfsmConstructor(initialState),
                $id = (Math.random()+'').substr(2)
            if(FSMName){
                FSMclasses[FSMName]=userfsmConstructor
                FSMinitSettings[FSMName]=settingObj.initial
            }
            if(createClassOnly===false){
                userfsmInstance.$id = $id
                cache[$id] = {isAsync:false,beginStateChange:null}
                startupEvent && startupEvent.call(userfsmInstance)
                return userfsmInstance;
            }
        }
        fsmClass.FSMs=FSMclasses

        if ( typeof noGlobal !== typeof undefined) {//若noGlobal为undefined，不注册到window
            window.FSM = fsmClass;
        }
        return fsmClass
        /**
         * 寄生组合式继承
         * @param subType
         * @param superType
         */
        function inheritFromSuperType(subType,superType){
            var UserFSM=function(){};//临时构造函数，收集共用方法
            if(typeof subType ==="function" && typeof superType === "function"){
                UserFSM.prototype=superType.prototype
                var prototype=new UserFSM();
                prototype.constructor=subType//修复constructor指向
                subType.prototype=prototype;
            }
        }
        function noop(){}
        function each(array,func){
            if(typeof func === "function" && typeof array === "object"){
                if(array instanceof Array){
                    for(var i= 0,length=array.length, one=array[0];i<length;i++,one = array[i]){
                        if(func(i, one) === false)
                            break;
                    }
                }else{
                    for(var j in array){
                        if(func(j, array[j])===false)
                            break;
                    }
                }
            }
        }
        function isFunction(func){
            return typeof func === "function"
        }
        function log(content){
            debug && console.log(content)
        }
    }))
})(window)
