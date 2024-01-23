//유경 api 개발 파일

//express라이브러리 가져옴
const router = require('express').Router()

// 몽고DB 객체 가져오는 작업. 이 파일에서 db 접근가능하게 하기 위함 ///////////////////////
let connectDB = require('./../database.js') //database.js 파일 경로

let db
connectDB.then((client)=>{
  console.log('유경 파일 DB연결성공')
  db = client.db('BIC_DB')
}).catch((err)=>{
  console.log(err)
}) 
//////////////////////////////////////////////


/*  //api 테스트용
router.get('/test', async (요청, 응답)=>{
    응답.send('/test로 접속 성공')
  })
*/






//이 파일 제일 하단에 router변수 export해줘야 server.js 메인파일에서 이 파일 접근가능
module.exports = router 