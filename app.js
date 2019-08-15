// 引入第三方模块
const mysql=require("mysql");
const express=require("express");
// 引入跨域模块
const cors=require("cors");
// 创建连接池
const pool=mysql.createPool({
  host:"127.0.0.1",
  user:"root",
  password:"",
  database:"hw"
})
// 创建express对象
var server=express();

// 绑定监听端口
server.listen(5050,()=>{
  console.log("服务器成功");
});

// 指定静态目录
server.use(express.static("public"));
// 配置cors跨域允许访问列表
server.use(cors({
  origin:["http://127.0.0.1:8080","http://localhost:8080"],
  // 提高安全性，每次访问都会验证
  credentials:true
}))

// index首页轮播图图片
server.get("/bannerlist",(req,res)=>{
  // 创建数据发送给客户端
  var rows=[
    {id:1,img_url:"imgs/banner1.jpg",a_href:"javascript:;"},
    {id:2,img_url:"imgs/banner2.jpg",a_href:"javascript:;"},
    {id:3,img_url:"imgs/banner3.jpg",a_href:"javascript:;"},
    {id:4,img_url:"imgs/banner4.jpg",a_href:"javascript:;"},
    {id:5,img_url:"imgs/banner5.jpg",a_href:"javascript:;"},
    {id:6,img_url:"imgs/banner6.jpg",a_href:"javascript:;"},
    {id:7,img_url:"imgs/banner7.jpg",a_href:"javascript:;"},
    {id:8,img_url:"imgs/banner8.jpg",a_href:"javascript:;"},
    {id:9,img_url:"imgs/banner9.jpg",a_href:"javascript:;"},
    {id:10,img_url:"imgs/banner10.jpg",a_href:"javascript:;"},
    {id:11,img_url:"imgs/banner11.jpg",a_href:"javascript:;"},
    {id:12,img_url:"imgs/banner12.jpg",a_href:"javascript:;"},
    {id:13,img_url:"imgs/banner13.jpg",a_href:"javascript:;"},
    {id:14,img_url:"imgs/banner14.jpg",a_href:"javascript:;"},
    {id:15,img_url:"imgs/banner15.jpg",a_href:"javascript:;"},
    {id:16,img_url:"imgs/banner16.jpg",a_href:"javascript:;"},
  ];
  res.send({code:1,data:rows});
});

// 登录
server.get("/login",(req,res)=>{
  var uname=req.query.uname;
  var upwd=req.query.upwd;
  var sql="SELECT uid FROM hw_user WHERE uname=? AND upwd=md5(?)";
  pool.query(sql,[uname,upwd],(err,result)=>{
    if(err) throw err;
     if(result.length>0){
      var id=result[0].uid;
      req.session=id;
      res.send({code:1,data:result});
     }else{
    res.send({code:-1,msg:"登录失败"});
     }
  })
});

// 注册
server.get("/reg",(req,res)=>{
  var uname=req.query.uname;
  var upwd=req.query.upwd;
  var upwd2=req.query.upwd2;
  var phone=req.query.phone;
  var city=req.query.city;
  var sql="INSERT INTO hw_user VALUES(null,?,md5(?),md5(?),null,?,?)"
  pool.query(sql,[uname,upwd,upwd2,phone,city],(err,result)=>{
    if(err) throw err;
    if(result.affectedRows>0){
      res.send({code:1,msg:"注册成功!"});
    }else{
      res.send({code:-1,msg:"注册失败!"});
    }
  })
});

//意见
server.get("/msg",(req,res)=>{
  var title=req.query.title;
  var content=req.query.content;
  var msg=req.query.msg;
  var sql="INSERT INTO hw_msg VALUES(null,?,?,?)";
  if(!content){
    res.send({code:-1,msg:"内容必须填写!"});
    return;
  }
  if(!msg){
    res.send({code:-1,msg:"联系方式必须填写!"});
    return;
  }
  pool.query(sql,[title,content,msg],(err,result)=>{
    if(err) throw err;
    if(result.affectedRows>0){
      res.send({code:1,msg:"提交成功!"});
    }else{
      res.send({code:-1,msg:"提交失败!"});
    }
  })
});

// 搜索
server.get("/search",(req,res)=>{
  var key=req.query.key;
  var sql=`SELECT * FROM hw_laptop WHERE lname LIKE '%${key}%'`; 
  pool.query(sql,[key],(err,result)=>{
    if(err) throw err;
    if(result.length>0){
      res.send({code:1,data:result});
    }else{
      res.send({code:-1,msg:"查询失败"});
    }
  })
}); 

//商品详情
server.get("/details",(req,res)=>{
  var lid=req.query.lid;
  var output={};
  var sql="SELECT * FROM hw_laptop WHERE lid=?";
  pool.query(sql,[lid],(err,result)=>{
    if(err) throw err;
    if(result.length>0){
      output.product=result[0];
      var fid=output.product.family_id;
      var sql="SELECT spec,lid FROM hw_laptop WHERE family_id=?";
      pool.query(sql,[fid],(err,result)=>{
        if(err) throw err;
        if(result.length>0){
          output.specs=result;
          var sql="SELECT * FROM `hw_laptop_pic` where laptop_id=?";
          pool.query(sql,[lid],(err,result)=>{
            if(err) throw err;
            output.pics=result;
            res.send(output);
          })
        }
      })
    }else{
      res.send({code:-1,msg:"查询失败!"})
    }
  });
});

// 获取评论列表 
server.get("/comment",(req,res)=>{
  var pno=req.query.pno;
  var pageSize=req.query.pageSize;
  if(!pno) pno=1;
  if(!pageSize) pageSize=7;
  // 创建变量保存发送给客户端数据
  var obj={code:1};
  // 创建变量保存进度
  var progress=0;
  var sql="SELECT cid,uname,content,ctime,point FROM hw_comment ORDER BY ctime DESC LIMIT ?,?";
  var count=(pno-1)*pageSize;
  pageSize=parseInt(pageSize);
  pool.query(sql,[count,pageSize],(err,result)=>{
    if(err) throw err;
    progress+=5;
    obj.data=result;
    if(progress==10)
    // 查询结果
    res.send(obj);
  });
  // 计算总页数
  pool.query("SELECT count(cid) AS c FROM hw_comment",(err,result)=>{
    if(err) throw err;
    progress+=5;
    var pc=Math.ceil(result[0].c/pageSize);
    obj.pageCount=pc;
    if(progress==10)
    res.send(obj);
  }) 
});

// 商品加入购物车
server.get("/addcart",(req,res)=>{
  var lid=req.query.lid;
  var price=req.query.price;
  var sql="SELECT title FROM hw_laptop WHERE lid=?"
  pool.query(sql,[lid],(err,result)=>{
    var ctitle=result[0].title;
    var sql="SELECT rid FROM hw_cart WHERE lid=?"
    pool.query(sql,[lid],(err,result)=>{
      if(err) throw err;
      if(result.length==0){
        var sql=`INSERT INTO hw_cart VALUES(null,1,${price},'${ctitle}',${lid})`;
      }else{
        var sql=`UPDATE hw_cart SET count=count+1 WHERE lid=${lid}`;
      }
      pool.query(sql,(err,result)=>{
        if(err) throw err;
        if(result.affectedRows>0){
          res.send({code:1,msg:"添加成功"});
        }else{
          res.send({code:-1,msg:"添加失败"});
        }
      })
    })
  })
});

// 购物车列表
server.get("/cartlist",(req,res)=>{
  var sql="SELECT rid,count,price,ctitle,lid FROM hw_cart";
  pool.query(sql,(err,result)=>{
    if(err) throw err;
    if(result.length>0){
      res.send({code:1,data:result});
    }else{
      res.send({code:-1,msg:"查询失败"});
    }
  })
});

// 删除购物车指定商品信息
server.get("/removecart",(req,res)=>{
  var rid=req.query.rid;
  var sql="DELETE FROM hw_cart WHERE rid=?";
  pool.query(sql,[rid],(err,result)=>{
    if(err) throw err;
    if(result.affectedRows==0){
      res.send({code:-1,msg:"删除失败"});
    }else{
      res.send({code:1,msg:"删除成功"});
    }
  })
});

// 删除购物车多个商品信息
server.get("/del",(req,res)=>{
  var rids=req.query.rids;
  var sql="DELETE FROM hw_cart WHERE rid IN ("+rids+")";
  pool.query(sql,(err,result)=>{
    if(err) throw err;
    if(result.affectedRows==0){
      res.send({code:-1,msg:"删除失败"});
    }else{
      res.send({code:1,msg:"删除成功"});
    }
  })
});

// 购物车商品数量加减
server.get("/add",(req,res)=>{
  var rid=req.query.rid;
  var sql="UPDATE hw_cart SET count=count+1 WHERE rid=?";
  pool.query(sql,[rid],(err,result)=>{
    if(result.affectedRows>0){
      res.send({code:1,data:"修改成功"});
    }else{
      res.send({code:-1,data:"修改失败"});
    }
  })
});
server.get("/down",(req,res)=>{
  var rid=req.query.rid;
  var sql="UPDATE hw_cart SET count=count-1 WHERE rid=?";
  pool.query(sql,[rid],(err,result)=>{
    if(result.affectedRows>0){
      res.send({code:1,data:"修改成功"});
    }else{
      res.send({code:-1,data:"修改失败"});
    }
  })
});