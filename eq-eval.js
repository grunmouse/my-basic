
/**
 * env - объект, отображающая имена на переменные и функции
 * eq - выражение в постфиксной форме
 */
function evaluate(eq, env){
	let stack = [];
	
	let len = eq.length;
	for(let i = 0; i<len; ++i){
		let item = eq[i];
		switch(item.type){
			case "missing":
			case "number":
				stack.push(item.value);
				break;
			case "string":
				throw new Error('String is not available');
			case "name":
			{
				let val = env.get(item.toString());
				stack.push(val);
				break;
			}
			case "fun":
			case "oper":
			{
				let fun = env.get(item.toString());
				let argcount = item.argcount;
				let args = stack.splice(-argcount, argcount);
				let result = fun(...args);
				stack.push(result);
				break;
			}
		}
	}
	return stack;
}

module.exports = {
	evaluate
};