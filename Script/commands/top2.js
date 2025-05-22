const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const app = express();

const PAGE_ACCESS_TOKEN = 'YOUR_PAGE_ACCESS_TOKEN';

app.use(bodyParser.json());

// Verify webhook
app.get('/webhook', (req, res) => {
  const VERIFY_TOKEN = 'YOUR_VERIFY_TOKEN';

  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// Handle messages
app.post('/webhook', (req, res) => {
  let body = req.body;

  if (body.object === 'page') {
    body.entry.forEach(function(entry) {
      let webhook_event = entry.messaging[0];
      let sender_psid = webhook_event.sender.id;

      if (webhook_event.message) {
        handleMessage(sender_psid, webhook_event.message);
      }
    });
    res.status(200).send('EVENT_RECEIVED');
  } else {
    res.sendStatus(404);
  }
});

function handleMessage(sender_psid, received_message) {
  let response;

  if (received_message.text) {
    const text = received_message.text.toLowerCase();

    switch (text) {
      case 'top':
        response = { text: "Top list:\n1. Command A\n2. Command B\n3. Command C" };
        break;
      case 'help':
        response = { text: "Available commands:\n- top\n- help\n- about" };
        break;
      case 'about':
        response = { text: "I'm a simple Messenger chatbot built using Node.js!" };
        break;
      default:
        response = { text: You sent: "${received_message.text}" };
    }
  }

  callSendAPI(sender_psid, response);
}

function callSendAPI(sender_psid, response) {
  const request_body = {
    recipient: {
      id: sender_psid
    },
    message: response
  };

  request({
    uri: 'https://graph.facebook.com/v12.0/me/messages',
    qs: { access_token: PAGE_ACCESS_TOKEN },
    method: 'POST',
    json: request_body
  }, (err, res, body) => {
    if (!err) {
      console.log('Message sent!');
    } else {
      console.error('Unable to send message:' + err);
    }
  });
}

app.listen(process.env.PORT || 1337, () => console.log('webhook is listening'));
