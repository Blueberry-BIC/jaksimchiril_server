// 몽고DB 객체를 export해서 다른 파일들에서 공통으로 쓸 수 있게 하기 위함

const { MongoClient } = require('mongodb')
const url = process.env.DB_URL  //db접속용 url 적기 -> .env파일에 각자의 몽고DB 접속 주소로 적기
let connectDB = new MongoClient(url).connect()

module.exports = connectDB 
