//민우 api 개발 파일      http://localhost:8081

const router = require('express').Router()


// 몽고DB 객체 가져오는 작업. 이 파일에서 db 접근가능하게 하기 위함 ///////////////////////
let connectDB = require('./../database.js') //database.js 파일 경로

let db
connectDB.then((client)=>{
  console.log('민우 파일 DB연결성공')
  db = client.db('BIC_DB')
}).catch((err)=>{
  console.log(err)
}) 
//////////////////////////////////////////////


//몽고 DB에 데이터 저장되는지 테스트 해보기위한 api코드 // http://localhost:8081/news 로 접속시 몽고db post컬렉션에 데이터 추가
router.get('/news', async (요청, 응답)=>{
    //await db.collection('post').insertOne({title : 'ㅁㅁㅁ'})
    응답.send('성공')
  })






  



//이 파일 제일 하단에 router변수 export해줘야 server.js 메인파일에서 이 파일 접근가능
module.exports = router 
