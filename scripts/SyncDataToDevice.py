import paho.mqtt.client as mqtt
import os, urlparse, json, sys, time
import random

loop = 0
if len(sys.argv) == 1:
	loop = 0
elif len(sys.argv) == 2:
	loop = sys.argv[1]
else:
	print('Wrong number of arguments')
	sys.exit(1)


def on_connect(client, userdata, flags, rc):
	print("rc: " + srt(rc))

def on_publish(client, obj, mid):
	print("Data sent")

def on_log(client, obj, level, string):
	print(string)

mqttc = mqtt.Client()
mqttc.on_connect = on_connect
mqttc.on_publish = on_publish

url = "http://soldier.cloudmqtt.com:14831"
url = urlparse.urlparse(url)

mqttc.username_pw_set("jwmrqghe","4EcqGXd0VyyA")
mqttc.connect(url.hostname, url.port)

topic = "/DevicesDate"

while True:
	value = random.randint(10, 500)
	data = {"deviceId": "5d67123ca68abd1e7ca4469f", "type": "BPM", "high": str(value), "low": str(value)} 
	mqttc.publish(topic, json.dumps(data, separators=(',',':')))
	print('Value: ' + str(value))
	if loop == 0:
		break
	else:
		time.sleep(loop)
print('Done')
