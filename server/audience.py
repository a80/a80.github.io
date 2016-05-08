# Code to process microphone input for audience data

import pyaudio
import wave
import audioop

from multiprocessing import Value

CHUNK = 1024
FORMAT = pyaudio.paInt16
CHANNELS = 2
RATE = 44100

# THIS VARIABLE STORES THE CURRENT NOISE LEVEL
noise_level = Value('i', 0)

def listen_audio() :
	p = pyaudio.PyAudio()

	stream = p.open(
		format=FORMAT,
		channels=CHANNELS,
		rate=RATE,
		input=True,
		frames_per_buffer=CHUNK)

	historySize = 30
	history = [0] * historySize
	i = 0
	while True: 
		data = stream.read(CHUNK)
		rms = audioop.rms(data, 2)

		history[i % historySize] = rms
		noise_level.value = sum(history) / len(history)
		i += 1

	stream.stop_stream()
	stream.close()
	p.terminate()