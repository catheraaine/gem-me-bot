import slack from 'slack';
import env from 'node-env-file';
import _ from 'lodash';
import exists from 'node-file-exists';

if (exists('./.env')) {
  env('./.env');
}

let bot = slack.rtm.client();
let token = process.env.SLACK_TOKEN;
let botName = 'gem-me-bot';
let gemsChannel = '#-gems';
let tilChannel = '#til';
var users = [];


function _getUser(userMap, id) {
  return users[_.findIndex(userMap, function(o) { return o.id == id; })];
}

bot.started(function(payload) {
  console.log('Gem-bot started!');
  slack.users.list({token}, function(err, data) {
    users = _.map(data.members, function(member) {
      return {
        name: member.name,
        id: member.id
      };
    });
  });
});

// respond to the `reaction_added` event.
bot.reaction_added(function(e) {
  var channel = '',
  gemUserId = '',
  minerUserId = '',
  ts = '',
  gemUser = null,
  minerUser = null;

  if (e.reaction === 'gem' && e.item.type === 'message') {

    channel = e.item.channel;
    ts = e.item.ts;
    gemUserId = e.item_user;
    minerUserId = e.user;

    gemUser = _getUser(users, gemUserId);
    minerUser = _getUser(users, minerUserId);

    console.log('A gem was spotted...');

    slack.channels.history({token, channel}, function (err, data) {
      _.forEach(data, function(messages) {
        _.forEach(messages, function(message) {
          var text = '',
          count = 0;
          if (message.reactions) {
            for(var i= 0; i < message.reactions.length; i++) {
              if (message.reactions[i].name === 'gem') {
                count = message.reactions[i].count; // How many times gemed?
              }
            }
            if (message.ts == ts && message.user == gemUserId && gemUser.name !== 'gem-me-bot' && count === 1) {
              text = minerUser.name + ': "' +  message.text + '" \n- @' + gemUser.name;
              slack.chat.postMessage({token: token, channel: gemsChannel, text: text, as_user: true, username: botName}, function(err, data) {
                console.log('sent gem message to ' + gemsChannel + ' channel.');
              });
            }
          }
        });
      });
    });
  } else if (e.reaction === 'lightbulb' && e.item.type === 'message') {

    channel = e.item.channel;
    ts = e.item.ts;
    tilUserId = e.item_user;
    minerUserId = e.user;

    tilUser = _getUser(users, tilUserId);
    minerUser = _getUser(users, minerUserId);

    console.log('A cool fact was spotted...');

    slack.channels.history({token, channel}, function (err, data) {
      _.forEach(data, function(messages) {
        _.forEach(messages, function(message) {
          var text = '',
          count = 0;
          if (message.reactions) {
            for(var i= 0; i < message.reactions.length; i++) {
              if (message.reactions[i].name === 'lightbulb') {
                count = message.reactions[i].count; // How many times lightbulbed?
              }
            }
            if (message.ts == ts && message.user == tilUserId && tilUser.name !== 'gem-me-bot' && count === 1) {
              text = minerUser.name + ': "' +  message.text + '" \n- @' + tilUser.name;
              slack.chat.postMessage({token: token, channel: tilChannel, text: text, as_user: true, username: botName}, function(err, data) {
                console.log('sent til message to ' + tilChannel + ' channel.');
              });
            }
          }
        });
      });
    });
  }
}
});

// start listening to the slack team associated to the token
bot.listen({token:token});
