
import json
import datetime
import boto3
import zipfile
import os
from botocore.exceptions import ClientError
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.application import MIMEApplication

def lambda_handler(event, context):
    # 準備 Bucket 及檔案路徑資訊
    BUCKET = "demo-cost-reports"
    TODAY_DATE = datetime.datetime.utcnow().date()
    MON = TODAY_DATE.strftime("%m")
    
    if MON == "12":
        NEXT_MON = "01"
    else:
        GET_NEXT = TODAY_DATE.replace(month=TODAY_DATE.month+1)
        NEXT_MON = GET_NEXT.strftime("%m")
    REPORT_DATE = TODAY_DATE.strftime("%Y%m") + "01-" + TODAY_DATE.strftime("%Y") + NEXT_MON + "01"
    S3_OBJ_PATH = "demo/demo-cost-report/" + REPORT_DATE
    
    s3 = boto3.resource('s3')
    bucket = s3.Bucket("demo-cost-reports")
    for obj in bucket.objects.filter(Prefix=S3_OBJ_PATH):
        if not os.path.exists("/tmp/" + REPORT_DATE):
            os.makedirs("/tmp/" + REPORT_DATE)
        file = obj.key.endswith("csv.gz")
        if file:
            bucket.download_file(obj.key, "/tmp/" + REPORT_DATE + "/" + os.path.basename(obj.key))

    # 取得檔案路徑下所有檔案
    zip_name = "/tmp/cost-report-" + REPORT_DATE + ".zip"
    compress = zipfile.ZipFile(zip_name, 'w')
    for root, directories, files in os.walk("/tmp/" + REPORT_DATE):
        for filename in files:
            filepath = os.path.join(root, filename)
            with compress:
                compress.write(filepath, filename)
    
    # 準備 Email 資訊
    SENDER = "SENDER-EMAIL-ADDRESS"
    RECIPIENT = "RECIVE-EMAIL-ADDRESS"
    AWS_REGION = "ap-northeast-1"
    SUBJECT = "Test Lambda task Send Email for Cost Report"
    ATTACHMENT = zip_name
    BODY_TEXT = "Hello,\r\nPlease see the attached file for a list of customers to contact."
    CHARSET = "utf-8"
    BODY_HTML = """\
    <html>
    <head></head>
    <body>
    <h1>重要!</h1>
    <p>附件為成本報告，請查收</p>
    </body>
    </html>
    """
    client = boto3.client('ses', region_name=AWS_REGION)
    msg = MIMEMultipart('mixed')
    msg['Subject'] = SUBJECT
    msg['From'] = SENDER
    msg['To'] = RECIPIENT
    msg_body = MIMEMultipart('alternative')
    textpart = MIMEText(BODY_TEXT.encode(CHARSET), 'plain', CHARSET)
    htmlpart = MIMEText(BODY_HTML.encode(CHARSET), 'html', CHARSET)
    msg_body.attach(textpart)
    msg_body.attach(htmlpart)
    att = MIMEApplication(open(ATTACHMENT, 'rb').read())
    att.add_header('Content-Disposition','attachment',filename=os.path.basename(ATTACHMENT))
    msg.attach(msg_body)
    msg.attach(att)
    
    # 寄出信件
    try:
        response = client.send_raw_email(
        Source=SENDER,
        Destinations=[
            RECIPIENT
        ],
        RawMessage={
            'Data':msg.as_string(),
        }
        )
        return {
        'statusCode': 200,
        'body': json.dumps('Hello from Lambda!')
        }
    except ClientError as e:
        print(e.response['Error']['Message'])
        return {
        'statusCode': 500,
        'body': json.dumps('ERROR! ' + e)
        }
    else:
        print("Email sent! Message ID:"),
        print(response['MessageId'])