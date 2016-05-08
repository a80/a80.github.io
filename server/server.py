from flask import Flask
from crossdomain import crossdomain

app = Flask(__name__)

# GET CURRENT RIDER SPEED
@app.route("/speedometer")
@crossdomain(origin='*')
def get_rider_speed():
	return str(10)

# GET CURRENT AUDIENCE NOISE LEVEL
@app.route("/audience_input")
@crossdomain(origin='*')
def get_audience_input() :
	return str(0)

if __name__ == '__main__':
	app.run()