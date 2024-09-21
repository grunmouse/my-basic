/**
 * Разбор строки BASIC методом рекурсивного спуска
 */
 
function input(str){
	let index = 0, len = str.length;

	//Subs
	function has(first, last){
		if(index>=len) return false;
		if(last){
			return str[index] >= first && str[index]<=last;
		}
		else if(first){
			return str[index] === first;
		}
		else{
			return true;
		}
	}

	function has09(){
		return has("0", "9");
	}
	
	function hasAZ(){
		return has("A","Z") || has("a","z");
	}
	
	class Segment{
		constructor(start, end, type){
			this.start = start;
			this.end = end;
			this.type = type;
		}
		
		fin(end){
			this.end = end;
		}
		
		toString(){
			return str.slice(this.start, this.end);
		}
	}
	const statmap = {
		'REM':function(){
			return {statname:'REM', comment:str.slice(index)};
		},
		'LET':function(){
			skipSpace();
			let name = keywordOrName();
			skipSpace();
			if(has("=")){
				return letName(name);
			}
			else if(has("(")){
				let res = letArr(name);
				if(!res.left){
					throw new Error('SN LET without equation');
				}
			}
		},
		'GOTO':function(){
			skipSpace();
			let to = numberOrLabel();
			if(!to){
				throw new Error('SN required number or label!');
			}
			return {statname:'GOTO', to};
		},
		'IF':function(){
			let condition = equation();
			let me = {statname:'IF', cond:condition};
			statements.push(me);
			skipSpace();
			let then = keywordOrName(), _else;
			me.then = statements.length;
			if(then == 'GOTO'){
				skipSpace();
				let to = numberOrLabel();
				statements.push({statname:'GOTO', to});
			}
			else if(then.toString() == 'THEN'){
				then = undefined;
				skipSpace();
				let to = numberOrLabel();
				if(to){
					skipSpace();
					if(index == len || has("'") || to.type == 'line'){
						then = {statname:'GOTO', to};
					}
					else if(to.type == 'label'){
						if(has('E')){
							let next = keywordOrName();
							if(next.toString() == 'ELSE'){
								_else = 'ELSE';
								then = {statname:'GOTO', to};
							}
						}
					}
					
					if(!then){
						index = to.name.start;
					}
				}
				if(then){
					statements.push(then);
				}
				else{
					//впереди не число, не изолированное имя и не ELSE
					manyStatements(['ELSE']);
					if(statements.length == me.then){
						me.then = 0;
					}
				}
			}
			else{
			}
			
			if(!_else){
				let next = keywordOrName();
				if(next.toString() == 'ELSE'){
					_else = 'ELSE';
				}
			}
			
			if(_else == 'ELSE'){
				statements.push({statname:'endline'});
				me.else = statements.length;
				_else = undefined;
				let to = numberOrLabel();
				if(to){
					skipSpace();
					if(index == len || has("'") || to.type == 'line'){
						statements.push({statname:'GOTO', to});
					}
					else{
						index = to.name.start;
					}
				}					
				if(!_else){
					manyStatements();
					if(statements.length == me.else){
						me.else = 0;
					}
				}
			}
		},
		'PRINT':function(){
			let items = [];
			while(index<len){
				skipSpace();
				if(has(',')){
					items.push(',');
					++index;
				}
				else if(has(';')){
					items.push(';');
					++index;
				}
				else if(has(':')){
					break;
				}
				else{
					let eq = equation([',']);
					items.push(eq);
				}
			}
			return {statname:'PRINT', items};
		},
		'INPUT':function(){
			let items = [];
			while(index<len){
				skipSpace();
				if(has(',')){
					items.push(',');
					++index;
				}
				else if(has(';')){
					items.push(';');
					++index;
				}
				else if(has(':')){
					break;
				}
				else{
					let eq = equation([',']);
					items.push(eq);
				}
			}
			return {statname:'INPUT', items};
		},
		'RUN':function(){
			skipSpace();
			let to = numberOrLabel();
			return {statname:'RUN', to};
		},
		'LIST':function(){
			skipSpace();
			let from = numberOrLabel();
			if(from){
				skipSpace();
				if(has("-")){
					skipSpace();
					var to = numberOrLabel();
				}
			}
			return {statname:'LIST', from, to};
		}
	};
	
	const INFIX = 1, PREFIX = 2;
	const opermap = {
		"+":  {type:INFIX, [INFIX]:10}, 
		"-":  {type:INFIX+PREFIX, [INFIX]:10, [PREFIX]:60}, 
		"/":  {type:INFIX, [INFIX]:30}, 
		"*":  {type:INFIX, [INFIX]:30}, 
		"\\": {type:INFIX, [INFIX]:20}, 
		"^":  {type:INFIX, [INFIX]:40, right:true},
		"MOD":{type:INFIX, [INFIX]:20},
		"=":  {type:INFIX, [INFIX]:9},
		"<>": {type:INFIX, [INFIX]:9},
		">":  {type:INFIX, [INFIX]:8},
		"<":  {type:INFIX, [INFIX]:8},
		"NOT":{type:PREFIX, [PREFIX]:7},
		"AND":{type:INFIX, [INFIX]:6},
		"OR": {type:INFIX, [INFIX]:5},
	};
	
	const operdfa = new DFA(
		"+", "-", "/", "*", "\\", "^", "=", "<>", ">", "<"
	);
	
	/*
	  Верно, если op2 вошёл раньше и имеет приоритет над op1
	 */
	function operPriority(op2, op1){
		/*
		Вводим только префиксные и инфиксные операторы
		*/
		/*
		x op2 y op1 z (in in) - по приоритету
		op2 y op1 z (pre in) - по приоритету
		x op2 op1 y (in pre) - false
		op2 op1 x (pre pre) - false
		*/
		
		if(op1.optype === PREFIX){
			return false;
		}
		if(op2.prior > op1.prior){
			return true;
		}
		if(op2.prior === op1.prior){
			return !op2.right;
		}
		return false;
		
	}
		
	function skipSpace(){
		while(has(" ")) ++index;
	}
	
	function decimalInt(){
		let tokenStart = index;
		while(has("0", "9")){
			++index;
		}
		let token = new Segment(tokenStart, index);
		token.value = parseInt(token.toString(), 10);
		return token;
	}
	
	function manyStatements(exclude){
		//let statements = [];
		while(index<len){
			skipSpace();
			let stat = statement(exclude);
			if(stat){
				statements.push(stat);
			}
			if(has(":")){
				++index;
			}
			else if(has("'")){
			}
			else{
				break;
			}
		}
		
		//return statements;
	}
	
	function statement(excludes){
		excludes = new Set(excludes);
		let name, start = index, result;
		if(has("A","Z")){
			name = keywordOrName().toString();
		}
		else if(has("'")){
			++index;
			name = "REM";
		}
		else{
			throw new Error("Unknown statement");
		}
		
		if(excludes.has(name)){
			index = start;
			return;
		}
		
		if(statmap[name]){
			result = statmap[name]();
		}
		else{
			//вошло имя, что за оператор принят по умолчанию?
			skipSpace();
			if(has("=")){
				//Это LET,
				result = letName(name, start);
			}
			else if(has("(")){
				result = letArr(name, start);
			}
			else if(has(":")){
				//Это метка
				result = {statname:"label", name: name};
			}
			else{
				throw new Error("Unknown statement");
			}
		}
		result.statpos = start; //позиция оператора в строке
		return result;
	}
	
	function keywordOrName(){
		let tokenStart = index;
		++index;
		while(has('A','Z') || has('0','9')){
			++index;
		}
		let nameEnd = index;
		if(has('#','&') || has('!')){
			++index;
		}
		let suffixEnd = index;
		return new Segment(tokenStart, suffixEnd);
	}
	

	function letName(name){
		++index;
		let eq = equation();
		return {statname:'LET', left:{type:"variable", name:name}, right: eq};
	}
	
	function letArr(name){
		++index;
		let args = argsValues();
		let left = {type:"array", name:name, indexes:args};
		skipSpace();
		if(has("=")){
			++index;
			let eq = equation();
			return {statname:'LET', left, right: eq};
		}
		else{
			return {statname:'arraycall', left};
		}
	}
	
	function argsValues(){
		skipSpace();
		let args = [];
		var eq;
		while(eq = equation([',',')'])){
			args.push(eq);
			if(has(")")){
				break;
			}
			if(!has(",")){
				throw new Error("Incorrect args separator");
			}
			++index; //,
		}
		++index;
		return args;
	}
	
	function equation(exclude){
		var token;
		var out = [];
		var stack = [];
		exclude = new Set(exclude);
		
		const stackTopType = ()=>{
			let top = stack[stack.length-1];
			return top && top.type;
		}
		
		token = equationToken();
		
		let aprefix = true;
		
		bytoken:while(token){
			if(stack.length == 0 && exclude.has(token.toString())){
				index = token.start;
				break;
			}
			switch(token.type){
				case "number":
				case "string":
					out.push(token);
					aprefix = false;
					break;
				case "name":
					{
						if(!aprefix){
							index = token.start;
							break bytoken;
						}
						let name = token;
						
						token = equationToken();
						if(token && token.type == "("){
							name.type = "fun";
							name.argcount = 0
							stack.push(name);
						}
						else{
							out.push(name);
							aprefix = false;
						}
						continue bytoken;
					}
				case "oper":
					{
						let op = opermap[token.toString()];
						token.optype = op.type & (aprefix ? PREFIX : INFIX);
						token.prior = op[token.optype];
						token.argcount = token.optype == INFIX ? 2 : 1;
						while(stackTopType() == 'oper' && operPriority(stack[stack.length-1], token)){
							out.push(stack.pop());
						}
						stack.push(token);
						
						aprefix = true;
					}
					break;
				case "(":
					stack.push(token);
					aprefix = true;
					break;
				case ",":
					{
						let missing = true;
						while(stackTopType() != '('){
							out.push(stack.pop());
							missing = false;
						}
						if(!stack.length){
							//throw new Error('SN skipped open (');
							index = token.start;
							return out;
						}
						if(stack[stack.length-2] && stack[stack.length-2].type == 'fun'){
							if(missing){
								out.push(new Segment(0,0,'missing'));
							}
							stack[stack.length-2].argcount++;
						}
						
						aprefix = true;
					}
					break;
				case ")":
					{
						let missing = true;
						while(stackTopType() != '('){
							out.push(stack.pop());
							missing = false;
						}
						if(!stack.length){
							//throw new Error('SN skipped open (');
							index = token.start;
							return out;
						}
						if(stack[stack.length-2] && stack[stack.length-2].type == 'fun'){
							if(missing){
								out.push(new Segment(0,0,'missing'));
							}
							stack[stack.length-2].argcount++;
						}
						

						stack.pop()
						if(stackTopType() == "fun"){
							out.push(stack.pop());
						}
						

						
						aprefix = false;
					}
					break;
				default:
					throw new Error('TODO eq token ' + token.type + " " + token.toString());
			}
			
			token = equationToken();
		}
		
		while(stack.length){
			if(stackTopType() == '('){
				throw new Error('SN skipped close )');
			}
			out.push(stack.pop());
		}
		
		return out;
	}
	
	function equationToken(){
		skipSpace();
		let tokenStart = index;
		if(has("A","Z")){
			let token = keywordOrName();
			token.type = opermap[token.toString()] ? "oper" : "name";
			return token;
		}
		
		if(has("0","9")){
			return numericLiteral();
		}
		
		if(has(".")){
			++index;
			if(has("0","9")){
				--index;
				return numericLiteral();
			}
			--index;
		}
		
		if(has('"')){
			return stringLiteral();
		}
		
		if(has('&')){
			++index;
			if(has("H")){
				return hexLiteral();
			}
			else if(has("O")){
				return octLiteral();
			}
			else if(has("B")){
				return binLiteral();
			}
			--index;
		}
		
		if(has("(")){
			++index;
			return new Segment(index-1, index, "(");
		}
		if(has(")")){
			++index;
			return new Segment(index-1, index, ")");
		}
		if(has(",")){
			++index;
			return new Segment(index-1, index, ",");
		}
		
		{
			operdfa.clear();
			let token = new Segment(index);
			while(operdfa.input(str[index])){
				++index;
				if(operdfa.isFinal()){
					token.fin(index);
					token.lex = operdfa.current;
				}
			}
			if(isNaN(token.end)){
				index = token.start;
				return ;
				//throw new Error('Unknown operator');
			}
			else{
				index = token.end;
			}
			token.type="oper";
			return token;
		}
	}
	
	function stringLiteral(){
		let token = new Segment(index);
		while(has('"')){
			++index; //open "
			while(!has('"')) ++index;
			++index; //close "
		};
		token.fin(index);
		token.type = "string";
		return token;
	}
	
	function numericLiteral(){
		let tokenStart = index;
		while(has("0", "9")) ++index;
		let endInt = index;
		if(has(".")){
			++index;
			while(has("0", "9")) ++index;
			var endPart = index;
		}
		if(has("E") || has("D")){
			++index;
			if(has("+") || has("-")){
				++index;
			}
			while(has("0", "9")) ++index;
			var endExp = index;
		}
		if(has('#','&') || has('!')){
			++index;
		}
		let suffixEnd = index;		
		let token = new Segment(tokenStart, index);
		token.type = "number";
		
		token.value = parseFloat(
			token.toString()
				.replace("D", "E")
				.replace(/^\./, "0.")
				.replace(/[#!&%]$/, "")
		);
		
		return token;
	}
	
	function hexLiteral(){
		let token = new Segment(index-1);
		++index;
		while(has("0","9") || has("A","F")) ++index;
		token.fin(index);
		token.type = "number";
		token.value = parseInt(
			token.toString().slice(2).replace(/[#!&%]$/, ""),
			16
		);
		return token;
	}
	function octLiteral(){
		let token = new Segment(index-1);
		++index;
		while(has("0","7")) ++index;
		token.fin(index);
		token.type = "number";
		token.value = parseInt(
			token.toString().slice(2).replace(/[#!&%]$/, ""),
			8
		);
		return token;
	}
	function binLiteral(){
		let token = new Segment(index-1);
		++index;
		while(has("0","1")) ++index;
		token.fin(index);
		token.type = "number";
		token.value = parseInt(
			token.toString().slice(2).replace(/[#!&%]$/, ""),
			2
		);
		return token;
	}
	
	function numberOrLabel(){
		if(has('A', 'Z')){
			let label = keywordOrName();
			return {type:'label', name:label};
		}
		else if(has('0', '9')){
			let number = decimalInt();
			return {type:'line', value:number};
		}
	}
	
	// Rnd Subs
	
	
	skipSpace();
	
	if(has("0", "9")){
		var number = decimalInt().value;
	}
	
	var statements = [];
	
	manyStatements();
	
	return {number, statements};

}

class DFA{
	constructor(...args){
		this._state = new Map();
		this._table = new Map();
		this._final = new Set();
		this._state.set("", this._table);
		this.current = "";
		for(let str of args){
			this.add(str);
		}
	}
	
	add(str){
		const len = str.length;
		this.clear();
		for(var i=0; i<len; ++i){
			if(!this.input(str[i])){
				var stateCode = str.substr(0, i+1);
				this._state.set(stateCode, new Map());
				this._table.set(str[i], stateCode);
				this.input(str[i]);
			}
		}
		if(stateCode){
			this._final.add(stateCode);
		}
		return true;
	}
	
	test(str, start=0){
		let len = str.length;
		this.clear();
		for(var i=0; i<len; ++i){
			if(!this.input(str[i])){
				return false;
			}
		}
		return true;
	}
	
	clear(){
		this.current = "";
		this._table = this._state.get(this.current);
	}
	
	input(sym){
		let newState = this._table.get(sym);
		if(newState == null){
			return false;
		}
		
		this.current = newState;
		this._table = this._state.get(this.current);
		return true;
	}
	
	isFinal(){
		return this._final.has(this.current);
	}
}

module.exports = {
	parseInput:input
}