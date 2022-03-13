const discord = require('discord.js');
const cron = require('node-cron');
const JapaneseHoliday = require('./japanese-holiday.js');
const fs = require('fs');

// set variables
const id_guild = '<DISCORD_SERVER_ID>';
const id_channel_general = '<DISCORD_CHANNEL_ID1>';
const id_channel_meeting = '<DISCORD_CHANNEL_ID2>';
const id_channel_service = '<DISCORD_CHANNEL_ID3>';
const id_role_group = '<DISCORD_ROLE_ID1>';
const id_role_bloger = '<DISCORD_ROLE_ID2>';
const id_role_develop = '<DISCORD_ROLE_ID3>';
const id_role_emoji = '<DISCORD_ROLE_ID4>';
const path_limit_data = 'data/limit_data.json';
const path_urldata = 'data/urldata.json';
const path_post_date = 'data/post_date.json';
const path_blog_status = 'data/blog_status.json';
const blog_member = {
    id: ['<MEMBER1_DISCORD_ID>', '<MEMBER2_DISCORD_ID>', '<MEMBER3_DISCORD_ID>', '<MEMBER4_DISCORD_ID>', '<MEMBER5_DISCORD_ID>'],
    stamp:['<MEMBER1_STAMP_ID>', '<MEMBER2_STAMP_ID>', '<MEMBER3_STAMP_ID>', '<MEMBER4_STAMP_ID>', '<MEMBER5_STAMP_ID>'],
    url: ['<MEMBER1_NAME>', '<MEMBER2_NAME>', '<MEMBER3_NAME>', '<MEMBER4_NAME>', '<MEMBER5_NAME>']
}

// set clients
const client = new discord.Client({ 
    intents: ["GUILDS", "GUILD_MEMBERS", "GUILD_MESSAGES", "GUILD_MESSAGE_REACTIONS"],
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
    restTimeOffset: 0
}); 

//set function
function csvSplit(line) {
    let c = "";
    let s = new String();
    let data = new Array();
    let QuoteFlg = false;
    for (var i = 0; i < line.length; i++) {
        c = line.charAt(i);
        if (/\s+/.test(c) && !QuoteFlg) {
            if(s !== "") data.push(s.toString());
            s = "";
        } else if (/\s+/.test(c) && QuoteFlg) {
            s += c;
        } else if (c == '"') {
            QuoteFlg = !QuoteFlg;
        } else {
            s += c;
        }
    }
    data.push(s.toString());
    return data;
}

// definite commands and events
async function check_files() {
    const files = fs.readdirSync(process.cwd());
    if(!(files.includes('data'))){
        await fs.mkdir('data', (err) => {
            if(err) return;
        });
    }
    const files_data = await fs.readdirSync('./data');
    if(!(files_data.includes('limit_data.json'))) fs.closeSync(fs.openSync(path_limit_data, 'w'));
    if(!(files_data.includes('urldata.json'))) fs.closeSync(fs.openSync(path_urldata, 'w'));
    if(!(files_data.includes('post_date.json'))) fs.closeSync(fs.openSync(path_post_date, 'w'));
    if(!(files_data.includes('blog_status.json'))) return false;
}

async function ready_assignment_develop() {
    const past_messages = client.channels.cache.get(id_channel_service).messages.fetch({limit: 10});
    const past_message_bool = (await past_messages).map(past_message => past_message.content.startsWith('【役職付与】'));
    if(!(past_message_bool.includes(true))) client.channels.cache.get(id_channel_service).send('【役職付与】Bot開発に関わるユーザーは、リアクション⚙️を押してください。\n絵文字を作成したいユーザーは、リアクション🖌️を押して下さい。');
}

async function assignment_bloger() {
    cron.schedule('0 0 8 * * *',() => {
        const post_date = JSON.parse(fs.readFileSync(path_post_date, 'utf-8'));
        blog_member.url.map(async (member, index) => {
            let limit_date = new Date(post_date[member]);
            const now_unix = new Date();
            limit_date.setDate(limit_date.getDate() + 30);
            const limit_unix = Date.parse(limit_date);
            const roles = await (await client.guilds.cache.get(id_guild).members.fetch(blog_member.id[index])).roles;
            if(limit_unix >= now_unix && !(roles.cache.has(id_role_bloger))) roles.add(id_role_bloger);
            if(limit_unix < now_unix && roles.cache.has(id_role_bloger)) roles.remove(id_role_bloger);
        });
    });
}

async function time_signal() {
    cron.schedule('0 0 8 * * *', async () =>{
        const now_time = new Date();
        const day = ['日', '月', '火', '水', '木', '金', '土'][now_time.getDay()];
        let sentence = `おはようございます。今日は ${now_time.getMonth() + 1}月${now_time.getDate()}日 ${day}曜日です。`;
        if(JapaneseHoliday.getHolidayName(now_time) != ""){
            sentence += `\n今日は ${JapaneseHoliday.getHolidayName(now_time)} です。`;
        } else if(now_time.getDay() == 0 || now_time.getDay() == 6){
            sentence += '\n今日は 休日 です。';
        }
        if(await check_files() !== false){
            let pv_json = JSON.parse(fs.readFileSync(path_blog_status, 'utf-8'));
            const yesterday_day = (7 + unix_time.getDay() - 1) % 7;
            const pv_difference = String(Number(pv_json.analytics[0][yesterday_day]) - Number(pv_json.analytics[1][yesterday_day]));
            if(unix_time.getDay() === 1){
                let sum_pv = [0, 0];
                for(let i = 0 ; i < 7 ; i ++){
                    sum_pv[0] += Number(pv_json.analytics[0][i]);
                    sum_pv[1] += Number(pv_json.analytics[1][i]);
                }
                sentence += '\n昨日のpv数は ' + pv_json.analytics[0][yesterday_day] + '回(先々週比: ';
                if(Number(pv_difference) > 0) sentence += '+'
                sentence += pv_difference + ' )です。\n先週のpv数は ' + String(sum_pv[0]) + '回(先々週比: ';
                if(sum_pv[0] - sum_pv[1] > 0) sentence += '+'
                sentence += String(sum_pv[0] - sum_pv[1]) + ' )です。';
                pv_json.analytics[0].map((pv, index) => {
                    pv_json.analytics[1][index] = pv;
                    pv_json.analytics[0][index] = 0;
                });
                fs.writeFileSync(path_blog_status, JSON.stringify(pv_json, null, 2));
            } else {
                sentence += '\n昨日のpv数は ' + pv_json.analytics[0][yesterday_day] + '回(先週比: ';
                if(Number(pv_difference) > 0) sentence += '+'
                sentence += pv_difference + ' )です。';
            }
        }
        client.channels.cache.get(id_channel_general).send(sentence);
    });
}

async function alerm_meeting() {
    const channel = client.channels.cache.get(id_channel_meeting);
    cron.schedule('0 0 20 1-7 * 6',() => {
        channel.send(`【月一定例会議】集合22:00~22:30 通話可能→👍 <@${id_role_group}>`);
    });
    cron.schedule('0 0 20 8-31 * 6',() => {
        channel.send(`【定期集会】集合22:00~22:30 通話可能→👍 <@${id_role_group}>`);
    });
}

async function add_reaction(message) {
    if(message.content.startsWith('【定期集会】') || message.content.startsWith('【月一定例会議】')){
        message.react('👍');
    }
    if(message.content.startsWith('【投票】')){
        const message_split = message.content.split(/\s+/);
        let emojis = message_split.map(content => {
            if(/\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu.test(content)) return content;
        });
        emojis = emojis.filter(emoji => emoji != undefined);
        emojis.map(emoji => message.react(emoji));   
    }
    if(message.content.startsWith('【役職付与】')){
        message.react('⚙️');
        message.react('🖌️');
    }
}

async function record_poll_limit(message) {
    let limit_json;
    try {
        limit_json = JSON.parse(fs.readFileSync(path_limit_data, 'utf-8'));
    } catch(error) {
        limit_json = {
            'id' : [],
            'date' : []
        }
    }       
    if(limit_json.id.length != limit_json.date.length){
        limit_json.id.push(message.id);
        fs.writeFileSync(path_limit_data, JSON.stringify(limit_json, null, 2));
    }  
}

async function test_function(message) {
    if(message.content === '!test'){
        message.channel.send('hello,' + message.author.username + '!');
    }
}

async function dice_function(message) {
    if(message.content.startsWith('!dice')){
        const message_split = message.content.split(/\s+/); 
        let dice_limit;
        let role_time;
        let dice_sum = 0;
        if(/^\d+$/.test(message_split[1])){
            dice_limit = Number(message_split[1]);
        } else {
            dice_limit = 6;
        }
        if(/^\d+$/.test(message_split[2])){
            role_time = Number(message_split[2]);
        } else {
            role_time = 1;
        }
        if(role_time < 2){
            dice_sum += Math.floor(Math.random() * dice_limit) + 1;
            message.channel.send('d' + dice_limit + ' => ' + dice_sum);
        } else {
            for(let i = 0 ; i < role_time ; i ++){
                dice_sum += Math.floor(Math.random() * dice_limit) + 1;
            }
            message.channel.send(role_time + 'd' + dice_limit + ' => ' + dice_sum);
        }
    }
}

async function now_function(message) {
    if(message.content === '!now'){
        const now_time = new Date();
        const date = now_time.getFullYear() + '/' +('0' + (now_time.getMonth() + 1)).slice(-2) + '/' + ('0' + now_time.getDate()).slice(-2) + ' ' + ('0' + now_time.getHours()).slice(-2) + ':' + ('0' + now_time.getMinutes()).slice(-2) + ':' + ('0' + now_time.getSeconds()).slice(-2);
        message.channel.send(date);
    }
}

async function poll_function(message) {
    if(message.content.startsWith('!poll')){
        const message_split = csvSplit(message.content);
        const title = message_split[message_split.indexOf('-t') + 1];
        let option_index = [];
        let stamp_index = [];
        let correction_index = 0;
        let limit_time;
        let screen_time;
        try{
            for(let i = 0 ; i < message_split.length ; i ++){
                if(/^-./.test(message_split[i]) && /^-./.test(message_split[i + 1])) throw 0;
                if(message_split[i] === '-s' && !(/\p{Emoji_Modifier_Base}\p{Emoji_Modifier}?|\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu.test(message_split[i + 1]))) throw 0;
                if(message_split[i] == '-s') stamp_index.push(message_split[i + 1]);
                if(message_split[i] == '-o') option_index.push(message_split[i + 1]);
                if(message_split[i] === '-l' || message_split[i] === '-d') {
                    const left_time = message_split[i + 1].split(/[\s+:+-+/+]/);
                    if(message_split[i] === '-l'){
                        limit_time = new Date();
                        switch(left_time.length){
                            case 6:
                                limit_time.setFullYear(limit_time.getFullYear() + Number(left_time[0]));
                                correction_index ++;
                            case 5:
                                limit_time.setMonth(limit_time.getMonth() + Number(left_time[correction_index]) + 1);
                                correction_index ++;
                            case 4:
                                limit_time.setDate(limit_time.getDate() + Number(left_time[correction_index]));
                                correction_index ++;
                            case 3:
                                limit_time.setHours(limit_time.getHours() + Number(left_time[correction_index]));
                                correction_index ++;
                            case 2:
                                limit_time.setMinutes(limit_time.getMinutes() + Number(left_time[correction_index]));
                                correction_index ++;
                            case 1:
                                limit_time.setSeconds(limit_time.getSeconds() + Number(left_time[correction_index]));
                        }
                        screen_time = limit_time.getFullYear() + '/' +('0' + (limit_time.getMonth() + 1)).slice(-2) + '/' + ('0' + limit_time.getDate()).slice(-2) + ' ' + ('0' + limit_time.getHours()).slice(-2) + ':' + ('0' + limit_time.getMinutes()).slice(-2) + ':' + ('0' + limit_time.getSeconds()).slice(-2);
                        limit_time = limit_time.getFullYear() + '/' +(limit_time.getMonth() + 1) + '/' + limit_time.getDate() + ' ' + limit_time.getHours() + ':' + limit_time.getMinutes() + ':' + limit_time.getSeconds();
                    } else {
                        const lim = 6 - left_time.length;
                        for(let i = 0 ; i < lim ; i ++){
                            if(left_time.length < 3){
                                left_time.push('1');  
                            } else {
                                left_time.push('0');
                            } 
                        }
                        screen_time = `${left_time[0]}/${('0' + left_time[1]).slice(-2)}/${('0' + left_time[2]).slice(-2)} ${('0' + left_time[3]).slice(-2)}:${('0' + left_time[4]).slice(-2)}:${('0' + left_time[5]).slice(-2)}`;
                        limit_time =`${left_time[0]}/${left_time[1]}/${left_time[2]} ${left_time[3]}:${left_time[4]}:${left_time[5]}`;
                    }
                    const limit_unix = Date.parse(limit_time);
                    if(!(/^\d+$/.test(limit_unix))) throw 0;
                    let limit_json;
                    try {
                        limit_json = JSON.parse(fs.readFileSync(path_limit_data, 'utf-8'));
                    } catch(error) {
                        limit_json = {
                            'id' : [],
                            'date' : []
                        }
                    }                    
                    limit_json.date.push(limit_unix);
                    fs.writeFileSync(path_limit_data, JSON.stringify(limit_json, null, 2));
                }
            }
            let poll_sentence = '【投票】' + title;
            if(message_split.indexOf('-l') != -1 || message_split.indexOf('-d') != -1) poll_sentence += `(～${screen_time})`;
            poll_sentence += '\n';
            for(let i = 0 ; i < option_index.length ; i ++){
                poll_sentence += stamp_index[i] + '   ' + option_index[i] + '\n';
            }
            message.channel.send(poll_sentence);
        } catch(error) {
            message.channel.send(`【ERROR】無効な引数です。`); 
        }
    }
}

async function fetch_reaction(reaction) {
    if (reaction.partial) {
		try {
			await reaction.fetch();
		} catch (error) {
			return;
		}
	}
}

async function reactionadd_alerm_meeting(reaction, user) {
    if(reaction.message.content.startsWith('【定期集会】') || reaction.message.content.startsWith('【月一定例会議】')){
        const now_unix = Date.parse(new Date());
        const limit_time = new Date(reaction.message.createdTimestamp);
        const limit_unix = Date.parse(`${limit_time.getFullYear()}/${limit_time.getMonth() + 1}/${limit_time.getDate()} 22:00:00`);
        const user_stamp = blog_member.stamp[blog_member.id.indexOf(String(user.id))];
        if(reaction.message.content.indexOf(user_stamp) === -1 && limit_unix >= now_unix){
            reaction.message.edit(reaction.message.content + user_stamp);
        } else if(limit_unix < now_unix) {
            reaction.message.reactions.removeAll();
        }
    }
}

async function reactionadd_poll(reaction, user) {
    if(reaction.message.content.startsWith('【投票】')){
        const message_split = reaction.message.content.split(/\n+/);
        const now_time = Date.parse(new Date());
        const user_stamp = blog_member.stamp[blog_member.id.indexOf(String(user.id))];
        let users_data = [];
        let limit_time;
        let limit_json;
        reaction.message.reactions.cache.get(reaction.emoji.name).users.cache.forEach(user_data => {
            users_data.push(user_data.bot);
        });
        try {
            limit_json = JSON.parse(fs.readFileSync(path_limit_data, 'utf-8'));
        } catch(error) {
            limit_json = {
                'id' : [],
                'date' : []
            }
        }
        const message_id_index = limit_json.id.indexOf(reaction.message.id);
        if(message_id_index !== -1){
            limit_time = limit_json.date[message_id_index];
        } else {
            limit_time = now_time;
        }
        if(limit_time >= now_time && users_data.indexOf(true) != -1){
            const sentences = message_split.map(sentence => {
                if(sentence.startsWith(reaction.emoji.name)){
                    if(reaction.count === 2 && sentence[sentence.length - 1] !== ' ') sentence += ' ';
                    if(sentence.indexOf(user_stamp) == -1)sentence += user_stamp;
                }
                return sentence + '\n';
            });
            reaction.message.edit(sentences.join(''));
        } else if(users_data.indexOf(true) != -1){
            reaction.message.reactions.removeAll();
            limit_json.date.splice(message_id_index, 1);
            limit_json.id.splice(message_id_index, 1);
            fs.writeFileSync(path_limit_data, JSON.stringify(limit_json, null, 2));
        }
    }
}

async function reactionadd_assignmelt_develop(reaction, user) {
    if(reaction.message.content.startsWith('【役職付与】')){
        reaction.message.guild.members.fetch();
        const roles = reaction.message.guild.members.resolve(user).roles;
        if(reaction.emoji.name === '⚙️' && !(roles.cache.has(id_role_develop))) await roles.add(id_role_develop);
        if(reaction.emoji.name === '🖌️' && !(roles.cache.has(id_role_emoji))) await roles.add(id_role_emoji);
    }
}

async function reactionremove_alerm_meeting(reaction, user) {
    if(reaction.message.content.startsWith('【定期集会】') || reaction.message.content.startsWith('【月一定例会議】')){
        const now_unix = Date.parse(new Date());
        const limit_time = new Date(reaction.message.createdTimestamp);
        const limit_unix = Date.parse(`${limit_time.getFullYear()}/${limit_time.getMonth() + 1}/${limit_time.getDate()} 22:00:00`);
        const user_stamp = blog_member.stamp[blog_member.id.indexOf(String(user.id))];
        if(limit_unix >= now_unix){
            reaction.message.edit(reaction.message.content.replace(user_stamp, ''));
        } else {
            reaction.message.reactions.removeAll();
        }
    }
}

async function reactionremove_poll(reaction, user) {
    if(reaction.message.content.startsWith('【投票】')){
        const message_split = reaction.message.content.split(/\n+/);
        const now_time = Date.parse(new Date());
        const user_stamp = blog_member.stamp[blog_member.id.indexOf(String(user.id))];
        let users_data = [];
        let limit_time;
        let limit_json;
        reaction.message.reactions.cache.get(reaction.emoji.name).users.cache.forEach(user_data => {
            users_data.push(user_data.bot);
        });
        try {
            limit_json = JSON.parse(fs.readFileSync(path_limit_data, 'utf-8'));
        } catch(error) {
            limit_json = {
                'id' : [],
                'date' : []
            }
        }
        const message_id_index = limit_json.id.indexOf(reaction.message.id);
        if(message_id_index !== -1){
            limit_time = limit_json.date[message_id_index];
        } else {
            limit_time = now_time;
        }
        if(limit_time >= now_time && users_data.indexOf(true) != -1){
            const sentences = message_split.map(sentence => {
                if(sentence.startsWith(reaction.emoji.name)){
                    sentence = sentence.replace(user_stamp, '');
                }
                return sentence + '\n';
            });
            reaction.message.edit(sentences.join(''));
        } else if(users_data.indexOf(true) != -1){
            reaction.message.reactions.removeAll();
            limit_json.date.splice(message_id_index, 1);
            limit_json.id.splice(message_id_index, 1);
            fs.writeFileSync(path_limit_data, JSON.stringify(limit_json, null, 2));
        }
    }
}

async function reactionremove_assignmelt_develop(reaction, user) {
    if(reaction.message.content.startsWith('【役職付与】')){
        reaction.message.guild.members.fetch();
        const roles = reaction.message.guild.members.resolve(user).roles;
        if(reaction.emoji.name === '⚙️' && roles.cache.has(id_role_develop)) await roles.remove(id_role_develop);
        if(reaction.emoji.name === '🖌️' && roles.cache.has(id_role_emoji)) await roles.remove(id_role_emoji);
    }
}

//execute events and commands 
client.once('ready', () => {
	client.channels.cache.get(id_channel_general).send('正常に再起動が完了しました。');
  
    check_files();

    ready_assignment_develop();
  
    assignment_bloger();
    
    time_signal();

    alerm_meeting();
});

client.on('messageCreate', message =>{
    if(message.author.bot){
        add_reaction(message);

        record_poll_limit(message);
    } else {
        test_function(message);
    
        dice_function(message);
        
        now_function(message);
        
        poll_function(message);
    }
});

client.on('messageReactionAdd', async (reaction, user) => {
	
    fetch_reaction(reaction);

    if(!user.bot){
        reactionadd_alerm_meeting(reaction, user);

        reactionadd_poll(reaction, user);
        
        reactionadd_assignmelt_develop(reaction, user);
    }   
});

client.on('messageReactionRemove', async (reaction, user) => {
    
    fetch_reaction(reaction);

    if(!user.bot){
        reactionremove_alerm_meeting(reaction, user);

        reactionremove_poll(reaction, user);
        
        reactionremove_assignmelt_develop(reaction, user);
    }
});

// DISCORD TOKEN is written on server local file. DO NOT EDIT BELOW HERE
client.login(process.env.DISCORD_TOKEN);