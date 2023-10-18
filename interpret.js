const {evaluate} = require('./eq-eval.js');

//Обрабатывает неисполняемые операторы
function prepare(lines, env){
	for(let IL = 0;IL<lines.length;++IL){
		let line = lines[IL];
		let NL = line.number;
		let stats = line.statements;
		
		for(let IS=0;IS<stats.length;++IS){
			let stat = stats[IS];
			switch(stat.statname){
				case 'label':
				{
					let name = stat.name;
					env.set(name, [NL, IS]);
					break;
				}
			}
		}
	}
}

//Выполняет исполняемые операторы
function run(lines, env, start){
	let IS = 0;
	let IL = 0;
	let NL = 0;
	
	const stack = [];
	let curLine;
	
	function _findLine(number){
		let first = 0;
	    let length = lines.length;
		const comp = (line, value)=>();
	    while (length > 0) {
			let rem = length & 1;
			length >>= 1;
			let line = lines[first+length];
			if (line.number == value) {
				return first+length
			}
			if (line.number < value) {
				first += length + rem;
			}
	   }
	   return first;
	}
	
	function _goto(number){
		IL = _findLine(number);
		IS = 0;
	}
	
	if(start){
		_goto(start);
	}
	run_line:while(IL<lines.length){
		let line = lines[IL];
		NL = line.number;
		IS = 0;
		let stats = line.statements;
		
		run_stat:while(IS<stats.length){
			let stat = stats[IS];
			switch(stat.statname){
				case 'GOTO':
				{
					let to = stat.to, number;
					if(to.type == 'label'){
						number = env.get(to.name.toString());
					}
					else{
						number = to.value.value;
					}
					_goto(number);
					continue run_line;
				}
				case 'endline':
					++IL;
					continue run_line;
				case 'LET':
				{
					let address;
					if(stat.left.type == "variable"){
						address = stat.left.name;
					}
					let value = evaluate(eq, env);
				}
				case 'PRINT':
				case 'INPUT':
				case 'IF':
				default:
			}
			++IS;
		}
	}
	
}