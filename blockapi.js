
 var express = require('express');
 var bodyparser = require('body-parser');
 var lodash = require('lodash');
 var schedule = require('node-schedule');
 var promise = require('promise');
 var joi =require('joi')
 var app = express();
 var mysql = require('mysql')
 var request = require('request');
 var async = require("async");
 app.use(bodyparser.json());
 var BlockIo = require('block_io');
 var version = 2; // API version
 var block_io = new BlockIo('e707-ee4a-572a-188a', 'sasikumar995', version);
 var litecoin = new BlockIo('0600-dfda-d403-10bc','sasikumar995',version);
 var dogecoin = new BlockIo('2a8c-a594-ecc7-1ce7','sasikumar995',version);
 var connect = mysql.createConnection   ({host :"localhost",user:"root",password:"mani",database:"blockio"})
 app.post("/sign_up",(req,res)=>{
    var username=req.body.username;
    var password = req.body.password;
     var object ={
         username:username,
         password:password
     }
     var schema = joi.object().keys({
        username: joi.string().email({ minDomainAtoms: 2 })
    })
    joi.validate({ username }, schema, function (err, value) { 
        if(err===null){
                var query="insert into account set ?"
                connect.query(query,object,(err,result)=>{
                    if(err) {
                        res.send("User Name Is Duplicate")
                    }else{ 
                       res.send("sign up successfully");
                    }
                   
                })
          
        }else{
            res.send("The Sign up is FAIL Because The User Name Is Give like *****@example.com")
        }
        
    });
    
   
 })
 app.post("/log_in",(req,res)=>{
        connect.query("select * from account where username=?",req.body.username,(err,result)=>{
            if(err) throw err;
            if(result[0]){
                var user = lodash.isEqual(req.body.password,result[0].password);
                if(user){ 
                    var log=["true",req.body.username]
                    connect.query("update account set login=?"+"where username=?",log,(er,resu)=>{
                        if(er){
                            res.send("The login is fail");
                        }else{
                            res.send("successfully log in");
                        }
                       
                    })
                   
                }
                else{
                    res.send("the Password is dismatch");
                }
            }
            else{
                res.send("The User Name is Wrong");
                console.log("The User Name is Wrong");
            }
           
        })
})
app.post("/log_out",(req,res)=>{
    var data=["false",req.body.username]
    connect.query("update account set login=?"+"where username=?",data,(err,result)=>{
        if(err){
            res.send("The User Account is NOT LOGOUT");
        }else{
            res.send("The User Account is successfully LOGOUT");
        }
    })
})
app.post("/address_generated",(req,res)=>{
    var array=[]
    connect.query("select * from account where username=?",req.body.username,(err,result)=>{
        if(err) throw err;
        if(result[0] && result[0].login=="true"){
            new promise((resolve,reject)=>{
                block_io.get_new_address({}, (reqs,resp)=>{ 
                    var bitcoin=[resp.data.address,req.body.username];
                    connect.query("update account set bitcoin=?"+"where username=?",bitcoin,(err,result)=>{
                        if(err) throw err;
                        resolve(resp.data.address);
                        array.push("bitcoin_address"+resp.data.address);
                    })
                    
                   
                 
                });
            }).then(data=>{
             return  new promise((resolve,reject)=>{
                dogecoin.get_new_address({},(reqs,resp)=>{
                    var dogecoin = [resp.data.address,req.body.username];
                    connect.query("update account set dogecoin=?"+"where username=?",dogecoin,(err,result)=>{
                        if(err) throw err;
                     array.push("dogecoin_address:"+resp.data.address);
                      resolve(result);
                    })
                    
                
                });
              })  
            }).then(data=>{
             return new promise((resolve,reject)=>{
                litecoin.get_new_address({},(reqs,resp)=>{
                    var litecoin = [resp.data.address,req.body.username];
                    connect.query("update account set litecoin=?"+"where username=?",litecoin,(err,result)=>{
                        if(err) throw err;
                        array.push("litecoin_address:"+resp.data.address);
                        resolve(result);
                    })
                    
                });
              }) 
            }).then(data=>{
             return  new promise((resolve,reject)=>{
                  connect.query("select bitcoin,litecoin,dogecoin from account where username=?",req.body.username,(err,result)=>{
                   
                    resolve(JSON.stringify(result));

                  })
               }) 
            }).then(value=>{
                var object={
                    coin:JSON.parse(value),
                    status:"the address is created successfully"
                }
                console.log(array);
                res.send(object);
            })
         
        }
        else{
            res.send("The User Name is Wrong or Account is Not Login");
            console.log("The User Name is Wrong");
        }
       
    })

})
var j = schedule.scheduleJob('*/1 * * * *', function(){
    connect.query("select bitcoin,litecoin,dogecoin from account",(err,result)=>{
        result.forEach(element => {
          setTimeout(()=>{
            block_io.get_address_balance({'address':element.bitcoin}, (reqs,resp)=>{
                var coin=resp.data.available_balance;
                let amount=coin-0.00005150;
                if(amount>0){             
                    block_io.withdraw_from_addresses({'amounts': amount, 'from_addresses': element.bitcoin, 'to_addresses': '2N7xeCye3PjN3gFNGXLsmtU2uVwRzzuBnt2'}, (reqs,resp)=>{
                        console.log("transfor the amount of bitcoin");
                    });
                }
                
            });
            litecoin.get_address_balance({'address':element.litecoin},(reqs,resp)=>{
                var coin = resp.data.available_balance;
                var amount = coin-0.00020000 ;
                if(amount>0){
                    litecoin.withdraw_from_addresses({'amounts': amount, 'from_addresses': element.litecoin, 'to_addresses': '2NEJqnJLVkddUViALo3PyTM1cg3QDX28AvW'}, (reqs,resp)=>{
                        console.log("transfer the amount of litecoin");
                    });
                }
            })
            dogecoin.get_address_balance({'address':element.dogecoin},(reqs,resp)=>{
                var coin = resp.data.available_balance;
                var amount = coin-1;
                if(amount>0){
                    dogecoin.withdraw_from_addresses({'amounts': amount, 'from_addresses': element.dogecoin, 'to_addresses': '2MyQ26hXnCtAcigWJaU6KcVBKTHXeRg1vLM'}, (reqs,resp)=>{
                        console.log("Transfer the amount of dogecoin");
                    });
                }
            })
            
          },500)
           
        
            //console.log(element.bitcoin,element.litecoin,element.dogecoin);
        });
    })
});
 app.listen(3000, function () {
    console.log('app running on port : 3000');
});
