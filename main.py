import os
import tweepy
from bs4 import BeautifulSoup
import requests
import schedule
import time
import json
from datetime import datetime, timedelta, date
import re
from googleapiclient.discovery import build
from google.auth import default

# set variables
api_key = '<API_KEY>'
api_secret = '<API_SECRET_KEY>'
access_token = '<ACCESS_TOKEN>'
access_secret = '<ACCESS_SECRET_TOKEN>'
SCOPES_ANALYTICS = ['https://www.googleapis.com/auth/analytics.readonly']
SCOPES_ADSENSE = ['https://www.googleapis.com/auth/adsense.readonly']
VIEW_ID = '<ANALYTICS_VIEW_ID>'
blog_url = '<BLOG_URL_LINK>'
blog_member = {
    'id': ['<MEMBER2_TWITTER_ID>', '<MEMBER2_TWITTER_ID>', '<MEMBER3_TWITTER_ID>', '<MEMBER4_TWITTER_ID>', '<MEMBER5_TWITTER_ID>'], 
    'url': ['<MEMBER1_NAME>', '<MEMBER2_NAME>', '<MEMBER3_NAME>', '<MEMBER4_NAME>', '<MEMBER5_NAME>']
}
post_date_path = 'data/post_date.json'
urldata_path = 'data/urldata.json'
blog_status_path = 'data/blog_status.json'

# set twitter client
auth = tweepy.OAuthHandler(api_key, api_secret)
auth.set_access_token(access_token, access_secret)
api = tweepy.API(auth)

# set analytics reporting api client
credentials, *_ = default(scopes = SCOPES_ANALYTICS)
analytics = build('analyticsreporting', 'v4', credentials=credentials)

# define boot events
def file_check():
    if not (os.path.isdir('data')):
        os.mkdir('data')
    if not (os.path.isfile(post_date_path)):
        with open(post_date_path, mode = 'wt', encoding = 'utf-8'):
            pass
    if not (os.path.isfile(urldata_path)):
        content = {
            'url': [],
            'new': []
        }
        with open(urldata_path, mode = 'wt', encoding =  'utf-8') as file:
            json.dump(content, file, ensure_ascii = False, indent = 2)
    if not (os.path.isfile(blog_status_path)):
        yesterday_dayweek = date.today().weekday()
        start_date = str(7 + yesterday_dayweek) + 'daysAgo'
        response = get_report(analytics, start_date, 'yesterday')
        save_pv(response)

# define web scraping events
def collect_post_date():
    last_post = {}
    for member in blog_member['url']:
        url = 'https://' + blog_url + '/category/member/' + member + '/'
        req_link = requests.get(url)
        soup_link = BeautifulSoup(req_link.text, 'html.parser')
        req_article = requests.get(soup_link.find('div', class_ = 'list ect-entry-card front-page-type-index').find('a').attrs['href'])
        soup_article = BeautifulSoup(req_article.text, 'html.parser')
        try :
            post_date = soup_article.find('span', class_ = 'post-update').find('time').get_text()
        except:
            post_date = soup_article.find('span', class_ = 'post-date').find('time').get_text()
        post_date = post_date.replace('.', '/')
        last_post[member] = post_date
    with open(post_date_path, mode = 'wt', encoding = 'utf-8') as file:
        json.dump(last_post, file, ensure_ascii = False, indent = 2)

def collect_urls():
    rep_blog = requests.get(blog_url)
    soup_blog = BeautifulSoup(rep_blog.text, 'html.parser')
    url_limit = 1
    with open(urldata_path, mode = 'r', encoding = 'utf-8') as file:
        urls_kelins = json.load(file)
    for link in soup_blog.find_all('a'):
        if link.get('href') != None:
            if not ('https://www.youtube.com' in link.get('href')) and not ('https://twitter.com' in link.get('href')) and not ('/page' in link.get('href')) and not ('/author' in link.get('href')) and not ('/category' in link.get('href')) and not (link.get('href') in urls_kelins['url']):
                urls_kelins['url'].append(link.get('href'))
                urls_kelins['new'].append(True)
            if 'https://' + blog_url + '/page/' in link.get('href') and url_limit < int(link.get('href')[len(link.get('href')) - 2]):
                url_limit = int(link.get('href')[len(link.get('href')) - 2])
    if url_limit > 1:
        for i in range(2, url_limit + 1):
            rep_blog = requests.get(blog_url + 'page/' + str(i) + '/')
            soup_blog = BeautifulSoup(rep_blog.text, 'html.parser')
            for link in soup_blog.find_all('a'):
                if link.get('href') != None:
                    if not ('https://www.youtube.com' in link.get('href')) and not ('https://twitter.com' in link.get('href')) and not ('/page' in link.get('href')) and not ('/author' in link.get('href')) and not ('/category' in link.get('href')) and not (link.get('href') in urls_kelins['url']):
                        urls_kelins['url'].append(link.get('href'))
                        urls_kelins['new'].append(True)
    urls_kelins['new'].pop(urls_kelins['url'].index('https://' + blog_url))
    urls_kelins['url'].pop(urls_kelins['url'].index('https://' + blog_url))
    urls_kelins['new'].pop(urls_kelins['url'].index('https://' + blog_url))
    urls_kelins['url'].pop(urls_kelins['url'].index('https://' + blog_url))
    urls_kelins['new'].pop(urls_kelins['url'].index('https://' + blog_url + '/%e3%83%97%e3%83%a9%e3%82%a4%e3%83%90%e3%82%b7%e3%83%bc%e3%83%9d%e3%83%aa%e3%82%b7%e3%83%bc/'))
    urls_kelins['url'].pop(urls_kelins['url'].index('https://' + blog_url + '/%e3%83%97%e3%83%a9%e3%82%a4%e3%83%90%e3%82%b7%e3%83%bc%e3%83%9d%e3%83%aa%e3%82%b7%e3%83%bc/'))
    with open(urldata_path, mode = 'wt', encoding = 'utf-8') as file:
        json.dump(urls_kelins, file, ensure_ascii = False, indent = 2)

# define twitter events
def tweet_new_article():
    with open(urldata_path, mode = 'r', encoding = 'utf-8') as file:
        urls_blog = json.load(file)
        try :
            req_article = requests.get(urls_blog['url'][urls_blog['new'].index(True)])
            soup_article = BeautifulSoup(req_article.text, 'html.parser')
            author_name = soup_article.find("figure", class_ = "eye-catch").find('span').string
            title = soup_article.find("h1").string.strip()
            sentence = '〘' + author_name + 'の新着記事〙\n' + title+ '\n' + urls_blog['url'][urls_blog['new'].index(True)]
            api.update_status(sentence)

        except:
            pass

def RT_blog():
    for username in blog_member['id']:
        tweets = api.user_timeline(screen_name = username, count = 20, exclude_replies = True)
        for tweet in tweets:
            if tweet.entities['urls'] != [] and blog_url in tweet.entities['urls'][0]['expanded_url']:
                try:
                    date = re.split('\s', str(tweet.created_at))
                    if date[0] == time.strftime('%Y-%m-%d'):
                        api.retweet(tweet.id)
                except:
                    pass

# define analytics reporting api events
def get_report(analytics, stard_date, end_date):
    body = {
        'reportRequests': [
            {
                'viewId': VIEW_ID,
                'dateRanges': [{'startDate': stard_date, 'endDate': end_date}],
                'metrics': [{'expression': 'ga:pageviews'}],
                'dimensions': [{'name': 'ga:date'}]
            }
        ]
    }
    return analytics.reports().batchGet(body = body).execute()

def save_pv(response):
    for report in response.get('reports', []):
        value = []
        for row in report.get('data', {}).get('rows', []):
            value.append(row.get('metrics', [])[0]['values'][0])
        yesterday_dayweek = date.today().weekday()
        try:
            with open(blog_status_path, mode = 'r', encoding = 'utf-8') as file:
                pv_json = json.load(file)
        except:
            pv_json = {
                'analytics': [
                    [0, 0, 0, 0, 0, 0, 0],
                    [0, 0, 0, 0, 0, 0, 0]
                ],
                'adsense': []
            }
        for i in range(0, len(value)):
            dayweek = (yesterday_dayweek - i + 7)
            pv_json['analytics'][abs(1 - (dayweek - 1) // 7)][dayweek % 7] = value[len(value) - i - 1]
    with open(blog_status_path, mode = 'wt', encoding = 'utf-8') as file:
        json.dump(pv_json, file, ensure_ascii = False , indent = 2)

def get_pv():
    response = get_report(analytics, 'yesterday', 'yesterday')
    save_pv(response)

# set executing functions
def run_job():
    schedule.every(10).minutes.do(RT_blog)
    return schedule.CancelJob

def main():
    file_check()
    run_time = datetime.now() + timedelta(minutes = (10 - int(datetime.now().minute) % 10))
    schedule.every().day.at(run_time.strftime('%H:%M')).do(run_job)
    schedule.every().day.at('00:30').do(get_pv)
    schedule.every().day.at('07:59').do(collect_post_date)
    schedule.every().day.at('19:59').do(collect_urls)
    schedule.every().day.at('20:00').do(tweet_new_article)
    print('正常に起動しました。')

    while True:
        schedule.run_pending()
        time.sleep(1)

main()

