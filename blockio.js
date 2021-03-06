
 var express = require('express');
 var bodyparser = require('body-parser');
 var lodash = require('lodash');
 var schedule = require('node-schedule');
 var app = express();
 var mysql = require('mysql')
 var request = require('request');
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
    let array=[];
     var object ={
         username:username,
         password:password
     }
    
     connect.connect((err)=>{
         if(err) throw err;
         var query="insert into account set ?"
         connect.query(query,object,(err,result)=>{
             if(err) throw err;
            array.push("user account is created");
         })
     })
    //  setTimeout(()=>{
    //      connect.query("select * from account where username=?",req.body.username,(err,result)=>{
    //          console.log(result[0].id);
    //      })
    //  },1000)
   block_io.get_new_address({}, (req,resp)=>{ 
       var bitcoin=[resp.data.address,username];
       connect.query("update account set bitcoin=?"+"where username=?",bitcoin,(err,result)=>{
           if(err) throw err;
           array.push("create bitcoin");
       })
       console.log(resp.data.address)
    });

    dogecoin.get_new_address({},(req,resp)=>{
       var dogecoin = [resp.data.address,username];
       connect.query("update account set dogecoin=?"+"where username=?",dogecoin,(err,result)=>{
           if(err) throw err;
           array.push("create dogecoin");
       })
       console.log(resp.data.address)
    });
    litecoin.get_new_address({},(req,resp)=>{
        var litecoin = [resp.data.address,username];
        connect.query("update account set litecoin=?"+"where username=?",litecoin,(err,result)=>{
            if(err) throw err;
            array.push("create litecoin");
        })
       console.log(resp.data.address);
     });
    setTimeout(()=>{
        connect.query("select * from account where username=?",req.body.username,(err,result)=>{
            if(err) throw err;
           
                var j = schedule.scheduleJob('30 * * * * *', function(){
                    var id =result[0].id;
                    block_io.get_address_balance({'address':result[0].bitcoin}, (reqs,resp)=>{
                        var coin=[resp.data.available_balance,id]
                        connect.query("update account set bitcoin_amt=?"+"where id=?",coin,(err,result)=>{
                            console.log("update bitcoin amount");
                        })
                    });
                    litecoin.get_address_balance({'address':result[0].litecoin},(reqs,resp)=>{
                        var coin = [resp.data.available_balance,id];
                        connect.query("update account set litecoin_amt=?"+"where id=?",coin,(err,result)=>{
                            console.log("update litecoin amount");
                        })
                    })
                    dogecoin.get_address_balance({'address':result[0].dogecoin},(reqs,resp)=>{
                        var coin = [resp.data.available_balance,id];
                        connect.query("update account set dogecoin_amt=?"+"where id=?",coin,(err,result)=>{
                            console.log("update dogecoin amount");
                        })
                    })
                    console.log(id);
                  });  
            
           // res.json();
        })
    
     },5000)

     res.send("sign up successfully");
 })
 app.post("/log_in",(req,res)=>{
        connect.query("select * from account where username=?",req.body.username,(err,result)=>{
            if(err) throw err;
            var user = lodash.isEqual(req.body.password,result[0].password);
            var id =result[0].id;
            if(user){
                var j = schedule.scheduleJob('30 * * * * *', function(){
                    block_io.get_address_balance({'address':result[0].bitcoin}, (reqs,resp)=>{
                        var coin=[resp.data.available_balance,id]
                        connect.query("update account set bitcoin_amt=?"+"where id=?",coin,(err,result)=>{
                            console.log("update bitcoin amount");
                        })
                    });
                    litecoin.get_address_balance({'address':result[0].litecoin},(reqs,resp)=>{
                        var coin = [resp.data.available_balance,id];
                        connect.query("update account set litecoin_amt=?"+"where id=?",coin,(err,result)=>{
                            console.log("update litecoin amount");
                        })
                    })
                    dogecoin.get_address_balance({'address':result[0].dogecoin},(reqs,resp)=>{
                        var coin = [resp.data.available_balance,id];
                        connect.query("update account set dogecoin_amt=?"+"where id=?",coin,(err,result)=>{
                            console.log("update dogecoin amount");
                        })
                    })
                   
                  });  
                  res.send("successfully log in");
            }
            else{
                res.send("the authentication is dismatch");
            }
            console.log(result);
            console.log(id);
            //res.json();
        })
})
 app.get("/amount_transfer",(req,res)=>{
    connect.query("select bitcoin,litecoin,dogecoin from account",(err,result)=>{
       result.forEach(element => {
        var j = schedule.scheduleJob('59 * * * * *', function(){
           block_io.get_address_balance({'address':element.bitcoin}, (reqs,resp)=>{
                var coin=resp.data.available_balance;
                console.log(coin);
                let amount=coin-0.00005150;
                if(amount>0){             
                    block_io.withdraw_from_addresses({'amounts': amount, 'from_addresses': element.bitcoin, 'to_addresses': '2N7xeCye3PjN3gFNGXLsmtU2uVwRzzuBnt2'}, (reqs,resp)=>{
                        console.log("transfor the amount of bitcoin");
                        console.log(resp)
                    });
                }
               
            });
            litecoin.get_address_balance({'address':element.litecoin},(reqs,resp)=>{
                var coin = resp.data.available_balance;
                console.log(coin);
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
                console.log(coin);
                if(amount>0){
                    dogecoin.withdraw_from_addresses({'amounts': amount, 'from_addresses': element.dogecoin, 'to_addresses': '2MyQ26hXnCtAcigWJaU6KcVBKTHXeRg1vLM'}, (reqs,resp)=>{
                        console.log("Transfer the amount of dogecoin");
                    });
                }
            })
           
          });
           //console.log(element.bitcoin,element.litecoin,element.dogecoin);
       });
    console.log(result);
    })
    res.json();
})
 app.listen(3000, function () {
    console.log('app running on port : 3000');
});