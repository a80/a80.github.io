from flask import Flask
from multiprocessing import Process, Value
from crossdomain import crossdomain
import audience
import speedometer

app = Flask(__name__)

# GET CURRENT RIDER SPEED
@app.route("/speedometer")
@crossdomain(origin='*')
def get_rider_speed():
	return str(speedometer.rider_speed.value)

# GET CURRENT AUDIENCE NOISE LEVEL
@app.route("/audience")
@crossdomain(origin='*')
def get_audience_input() :
	return str(audience.noise_level.value)

def setup() :
	p_audience = Process(target=audience.listen_audio)
	p_audience.start()
	p_speedometer = Process(target=speedometer.detect_speed)
	p_speedometer.start()

if __name__ == '__main__':
	setup()
	app.run()