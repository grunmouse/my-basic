const {parseInput} = require('../str-parser.js');

const cons = new console.Console({
	stdout:process.stdout,
	stderr:process.stderr,
	colorMode:true,
	inspectOptions:{
		depth:5
	}
});

const assert = require('assert');

describe('line parser', ()=>{

	it('REM', function(){
		let line = parseInput("10 REM AAAAA");
		assert(line.statements.length == 1);
		assert(line.statements[0].statname == 'REM');
		assert(line.statements[0].comment == ' AAAAA');
	});
	
	it("apostrohpe", function(){
		let line = parseInput("10' AAAAA");
		assert(line.number == 10);
		assert(line.statements.length == 1);
		assert(line.statements[0].statname == 'REM');
		assert(line.statements[0].comment == ' AAAAA');
	});
	
	it("[LET]", function(){
		let line = parseInput("20 A = B")
		assert(line.statements.length == 1);
		assert(line.statements[0].statname == 'LET');
		//assert(line.statements[0].comment == ' AAAAA');
	});
	
	it('command [LET]', function(){
		let line = parseInput("A = B")
		assert(line.number == null);
		assert(line.statements.length == 1);
		assert(line.statements[0].statname == 'LET');
	});

	it('many stats', function(){
		let line = parseInput("30 A = B: B = C: REM MANY OPERATORS");
		assert(line.number == 30);
		assert(line.statements.length == 3);
		assert(line.statements[0].statname == 'LET');
		assert(line.statements[1].statname == 'LET');
		assert(line.statements[2].statname == 'REM');
	});
	
	it('apostrophe after stat', function(){
		let line = parseInput("50 A = B'Remark");
		assert(line.number == 50);
		assert(line.statements.length == 2);
		assert(line.statements[0].statname == 'LET');
		assert(line.statements[1].statname == 'REM');
	});
	
	describe('equation', ()=>{
		it('equation 1', function(){
			let line = parseInput("E = SQR(M^2*C^4 + (P*C)^2)");
			
		});
		it('equation 2', function(){
			let line = parseInput("E = Y^2");
			
		});
		it('equation 3', function(){
			let line = parseInput("B = Y^2 = E");
			
		});
	});

	it('LET array item', function(){
		let line = parseInput("A(1,2)=10");
		
	});

	describe('label', ()=>{
		it('label', function(){
			let line = parseInput('60 MET:');
			assert(line.number == 60);
			assert(line.statements.length == 1);
			assert(line.statements[0].statname == 'label');
		});

		it('label with stat', function(){
			let line = parseInput('60 MET: A=B');
			assert(line.number == 60);
			assert(line.statements.length == 2);
			assert(line.statements[0].statname == 'label');
			assert(line.statements[1].statname == 'LET');
		});

		it('many label', function(){
			let line = parseInput('60 M1: A=1: M2 : B=1');
			assert(line.number == 60);
			assert(line.statements.length == 4);
			assert(line.statements[0].statname == 'label');
			assert(line.statements[1].statname == 'LET');
			assert(line.statements[2].statname == 'label');
			assert(line.statements[3].statname == 'LET');
		});
	});
	
	describe('string literal', ()=>{
		it('string literal', function(){
			let line = parseInput('A$ = "abcd abcd"');
			let stat = line.statements[0];
			assert(stat.statname == 'LET');
			assert(stat.left.name == 'A$');
			//cons.log(""+stat.right);
			assert((""+stat.right) == '"abcd abcd"');
		});
		it('string literal2', function(){
			let line = parseInput('A$ = "abcd abcd"" 123456 $$"');
			let stat = line.statements[0];
			assert(stat.statname == 'LET');
			assert(stat.left.name == 'A$');
			assert(""+stat.right == '"abcd abcd"" 123456 $$"');
		});
	});
	
	describe('number literal', ()=>{
		it('number literal', function(){
			let line = parseInput('A% = 12345');
			let stat = line.statements[0];
			assert(stat.statname == 'LET');
			assert(stat.left.name == 'A%');
			assert(""+stat.right == '12345');
		});
		it('number literal float', function(){
			let line = parseInput('A! = 12.345');
			let stat = line.statements[0];
			assert(stat.statname == 'LET');
			assert(stat.left.name == 'A!');
			assert(""+stat.right == '12.345');
		});
		it('number literal leader point', function(){
			let line = parseInput('A! = .345');
			let stat = line.statements[0];
			assert(stat.statname == 'LET');
			assert(stat.left.name == 'A!');
			assert(""+stat.right == '.345');
		});
		it('number literal exp', function(){
			let line = parseInput('A! = .345E+1');
			let stat = line.statements[0];
			assert(stat.statname == 'LET');
			assert(stat.left.name == 'A!');
			assert(""+stat.right == '.345E+1');
		});
		it('number literal exp neg', function(){
			let line = parseInput('A! = .345E-12');
			let stat = line.statements[0];
			assert(stat.statname == 'LET');
			assert(stat.left.name == 'A!');
			assert(""+stat.right == '.345E-12');
		});
		it('number literal exp not sign', function(){
			let line = parseInput('A! = .345E12');
			let stat = line.statements[0];
			assert(stat.statname == 'LET');
			assert(stat.left.name == 'A!');
			assert(""+stat.right == '.345E12');
		});
		it('number literal exp D', function(){
			let line = parseInput('A# = .345D12');
			let stat = line.statements[0];
			assert(stat.statname == 'LET');
			assert(stat.left.name == 'A#');
			assert(""+stat.right == '.345D12');
		});
	});
	
	describe('IF', ()=>{
		it('IF THEN empty', function(){
			let line = parseInput('IF A = B THEN');
			let stat = line.statements[0];
			assert(stat.statname == 'IF');
			assert(""+stat.cond == "A,B,=");
			assert(stat.then == 0);
		});
		
		function testIfThen(label, code, assertion){
			let ends = ["", " 'remark", " ELSE"];
			for(let end of ends){
				it(label+end, function(){
					let line = parseInput(code+end);
					let stat = line.statements[0];
					assertion(stat, line.statements);
				});
			}
		}
		
		const thenGoto60 = (stat, stats)=>{
			assert(stat.then != 0);
			let then = stats[stat.then];
			assert.equal(then.statname, 'GOTO');
			assert.equal(then.to.type,'line');
			assert.equal(then.to.value.toString(), '60');
		};
		const thenGotoMET = (stat, stats)=>{
			assert(stat.then != 0);
			let then = stats[stat.then];
			assert.equal(then.statname, 'GOTO');
			assert.equal(then.to.type, 'label');
			assert.equal(then.to.name.toString(), 'MET');
		};
		
		describe('IF GOTO', ()=>{
			testIfThen('IF GOTO number', 'IF A = B GOTO 60', thenGoto60);
			testIfThen('IF GOTO label', 'IF A = B GOTO MET', thenGotoMET);
		});
		describe('IF THEN as GOTO', ()=>{
			testIfThen('IF GOTO number', 'IF A = B THEN 60', thenGoto60);
			testIfThen('IF GOTO label', 'IF A = B THEN MET', thenGotoMET);
		});		
		describe('IF THEN GOTO', ()=>{
			testIfThen('IF THEN GOTO number', 'IF A = B THEN GOTO 60', thenGoto60);
			testIfThen('IF THEN GOTO label', 'IF A = B THEN GOTO MET', thenGotoMET);
		});
		describe('IF THEN [LET]', ()=>{
			testIfThen('IF THEN [LET]', 'IF A = B THEN A = C', (stat, stats)=>{
				let then = stats[stat.then];
				assert(then.statname == 'LET');
				assert(then.left.name == 'A');
				assert(then.right + "" == 'C');
			});			
		});
	});
	
});
