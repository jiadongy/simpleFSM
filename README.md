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

---------

> **Note：寄生组合式继承**
所谓寄生式组合继承，即通过借用构造函数来继承属性，通过原型链的混成形式来继承方法。其背后的基本思路是：不必为了指定子类型的原型而调用超类型的构造函数，我们所需要的无非就是超类型原型的一个副本而已。本质上，使用寄生式继承来继承超类型的原型，然后再将结果指定给子类型的原型。

```javascript
function object(o) {
    function F() {}
    F.prototype = o;
    return new F();
}
function inheritPrototype(subType, superType) {
    var prototype = object(superType.prototype);  //创建对象
    prototype.constructor = subType;              //增强对象
    subType.prototype = prototype;                //指定对象
}
```

> **Note：组合继承**
组合继承是javaScript最常用的继承模式；不过，它也有自己的不足。组合继承最大的问题就是无论什么情况下，都会调用两次超类型构造函数：一次是在创建子类型原型的时候，另一次是在子类型构造函数内部。没错，子类型最终会包含超类型对象的全部实例属性，但我们不得不在调用子类型构造函数时重写这些属性。

```javascript
function SuperType(name) {
    this.name = name;
    this.colors = ["red", "blue", "green"];
}
SuperType.prototype.sayName = function () {
    alert(this.name);
};
function SubType(name, age){
    SuperType.call(this, name);       //第二次调用SuperType()
    this.age = age;
}
SubType.prototype = new SuperType();  //第一次调用SuperType()
SubType.prototype.construcotr = SubType;
SubType.prototype.sayAge = function() {
    alert(this.age);
}
```
