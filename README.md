simpleFSM
=========

## 主要知识点
* Moore型有限状态机
* 寄生组合式继承，实现共用方法代码，保持实例属性
* IIFE，实现控制私有作用域
* 由AMD降级为Window

----------

a simple FSM based on Javascript
* 参考Javascript Finite State Machine的Usage实现
* Reference：
	* [https://github.com/jakesgordon/javascript-state-machine](https://github.com/jakesgordon/javascript-state-machine "Javascript Finite State Machine")
	* FSM Wiki

##特性说明(较之Javascript FSM)
###新增特性
* `create`函数支持4种“重载”形式
	* `create(settingObj) `
		* 由配置项生成FSM实例
		* Example:`create({....})`，请参考Javascript FSM
	* `create(settingObj,ClassName)`
		* 由配置项生成FSM实例，并注册可重用的FSM类，将其命名为ClassName
		* Example:`create({...},'testFSM')`
	* `create(settingObj,ClassName,onlyClass) `
		* 由配置项注册可重用的FSM类，将其命名为ClassName，不生成实例
		* Example:`create({...},'testFSM',true)`
	* `create(ClassName)`
		* 由ClassName生成FSM实例,若不存在会抛出错误
		* Example:`create('testFSM')`
* 由`FSMs`变量暴露所有注册的FSM类
* 支持AMD规范

###未实现特性
* 配置项中`initial`不支持`defer`

###修改特性
* 取消异步状态变迁的函数由`transition.cancel()`改为`cancel()`


