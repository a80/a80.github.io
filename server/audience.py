# Code to process microphone input for audience data

import pyaudio
import wave
import audioop

CHUNK = 1024
FORMAT = pyaudio.paInt16
CHANNELS = 2
RATE = 44100
RECORD_SECONDS = 5
WAVE_OUTPUT_FILENAME = "output.wav"

def listen_audio() :
	p = pyaudio.PyAudio()

	stream = p.open(
		format=FORMAT,
		channels=CHANNELS,
		rate=RATE,
		input=True,
		frames_per_buffer=CHUNK)

	while True: 
		data = stream.read(CHUNK)
		rms = audioop.rms(data, 2) 
		print "rms = ", rms

	stream.stop_stream()
	stream.close()
	p.terminate()