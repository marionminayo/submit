const express = require('express')
const crypto = require('crypto')
const path = require('path')
const app = express()
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
const multer = require('multer')
const GridFsStorage = require('multer-gridfs-storage')
const Grid = require('gridfs-stream')
const methodOverride = require('method-override')
const pdftotext = require('pdftotextjs');
const writeFile = require('write');


//middleware
app.use(bodyParser.json())
app.use(methodOverride('_method'))

//mongo URI
const mongoURI = 'mongodb://marion:FN3QUERYS@ds145304.mlab.com:45304/uploads'

//create mongo connection
const conn = mongoose.createConnection(mongoURI)

//initialize gfs
let gfs

conn.once('open',  ()=> {
    //initialized stream
    gfs = Grid(conn.db, mongoose.mongo);
    gfs.collection('uploads')
})
//create storage engine
const storage = new GridFsStorage({
    url: mongoURI,
    file: (req, file) => {
      return new Promise((resolve, reject) => {
        crypto.randomBytes(16, (err, buf) => {
          if (err) {
            return reject(err);
          }
          const filename = buf.toString('hex') + path.extname(file.originalname);
          const fileInfo = {
            filename: filename,
            bucketName: 'uploads'
          };
          resolve(fileInfo);
        });
      });
    }
  });
  const upload = multer({ storage });

app.set('view engine', 'ejs')

// @router GET /
// @desc loads form
app.get('/',(req,res)=>{
    gfs.files.find().toArray((err,files)=>{
        //check if files exist
        if(!files || files.length === 0){
            res.render('index', {files : false})
        }else{
            files.map(file =>{
                if(file.contentType === 'image/jpeg' || file.contentType === 'image/png'){
                    file.isImage = true
                }else{
                    file.isImage = false

                }
            })
            res.render('index', {files:files})

        }
        
    })
})

// @router POST /upload
// @desc uploads file to db
app.post('/upload', upload.single('file'), (req, res)=>{
    //res.json({file : req.file})
    res.redirect('/')
})

// @router GET /files
// @display all files in json
app.get('/files', (req, res)=>{
    gfs.files.find().toArray((err,files)=>{
        //check if files exist
        if(!files || files.length === 0){
            return res.status(404).json({
                err : 'No files to display'
            })
        }
        //files exist
        return res.json(files)
        
    })
})

// @router GET /files/:filname
// @display a file in json
app.get('/files/:filename', (req, res)=>{
    gfs.files.findOne({filename : req.params.filename},(err,file)=>{
        //check if files exist
        if(!file || file.length === 0){
            return res.status(404).json({
                err : 'No file exists'
            })
        }
        //file exists
        const readstream = gfs.createReadStream(file.filename);
        readstream.pipe(res);
    })
})

// @router GET /files/:image
// @display an image in json
app.get('/image/:filename', (req, res)=>{
    gfs.files.findOne({filename : req.params.filename},(err,file)=>{
        //check if files exist
        if(!file || file.length === 0){
            return res.status(404).json({
                err : 'No file exists'
            })
        }
        //check if image
        if(file.contentType === 'image/jpeg' || file.contentType === 'image/png'){
            //read output to browser
            const readstream = gfs.createReadStream(file.filename);
            readstream.pipe(res);
        } else{
            return res.status(404).json({
                err: 'not an image'
            })
        }
    })
})

// @route DELETE /files/:id
// @desc delete file
app.delete('/files/:id',(req,res)=>{
    gfs.remove({_id:req.params.id, root: 'uploads'}, (err, gridStore)=> {
        if (err){
            return res.status(404).json({err: err})
        } 
        res.redirect('/')
      });
})

/*const folder = {
    const pdftotext = require('pdftotextjs');
const pdf = new pdftotext('/home/marion/Desktop/search/computervision-1.pdf');
const data = pdf.getTextSync(); // returns buffer
console.log(data.toString('utf8'));
const filename = 'boo'
const writeFile = require('write');
writeFile('/home/marion/Desktop/search/'+filename+'.txt', data.toString('utf8'), function(err) {
  if (err) console.log(err);
});
}*/
app.get('/change',(req,res)=>{
    const pdf = new pdftotext('/files');
    const data = pdf.getTextSync(); // returns buffer
    console.log(data.toString('utf8'));
    const writeFile = require('write');
    
})

const port = 5000
app.listen(port,()=>console.log('app started on port '+port))
