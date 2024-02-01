//설치한 express라이브러리 가져오기 코드
const express = require('express')
const app = express()

//환경변수를 저장해줄 .env파일을 만들기 위한 셋팅
require('dotenv').config()

app.use(express.json())
app.use(express.urlencoded({extended:true})) 


//api 분리해서 개발한 것들 가져와줌
app.use('/', require('./routes/minwoo.js') )  //민우 api파일
app.use('/', require('./routes/yukyeong.js') )  //유경 api파일


//몽고DB 가져옴  /////////////////////////////////
let connectDB = require('./database.js') 

let db

connectDB.then((client)=>{
  console.log('메인 파일 DB연결성공')
  db = client.db('BIC_DB')

  //서버 띄우는 코드.  http://localhost:8081 으로 서버 접속 가능 -> .env파일 만들어서 각자의 포트번호로 적기. 8080이나 8081 적으면 될듯
  app.listen(process.env.PORT, () => {
    console.log('http://localhost:8081 에서 서버 실행중')
  })
  
}).catch((err)=>{
  console.log(err)
})
///////////////////////////////////////////////////////




//api 테스트  
app.get('/', (요청, 응답) => {
  응답.send('메인페이지')
}) 




