import cv2
import numpy as np
import datetime
import math
from multiprocessing import Value

rider_speed = Value('d', 0.0)

def detect_speed() :

	cap = cv2.VideoCapture(0)

	## ADJUSTMENT FACTORS
	lower_red = np.array([0, 0, 100])
	higher_red = np.array([255, 255, 255])
	hit_cutoff = 0.2
	rect_w = 40
	rect_h = 300
	wheel_radius = 18 ## inches

	## INITIALIZE FRAME CAPTURER
	rect_area = rect_h * rect_w
	wheel_circumference = 2.0 * math.pi * wheel_radius
	_, frame = cap.read()

	w = frame.shape[1]
	h = frame.shape[0]
	p1 = (w/2 - rect_w/2, h/2 - rect_h/2)
	p2 = (w/2 + rect_w/2, h/2 + rect_h/2)

	prev_hit = False
	prev_hit_timestamp = None

	while (True) :
		_, frame = cap.read()

		masked = frame[p1[1]:p2[1], p1[0]:p2[0]]
		masked = cv2.inRange(masked, lower_red, higher_red)

		masked = cv2.erode(masked, cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5)))
		masked = cv2.dilate(masked, cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5)))

		masked = cv2.dilate(masked, cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5)))
		masked = cv2.erode(masked, cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5)))

		nHits = np.sum(masked) / 255
		pctHits = float(nHits) / rect_area

		# print "HIT: ", pctHits

		if pctHits > hit_cutoff:
			if not prev_hit :
				prev_hit = True
				hit_timestamp = datetime.datetime.now()

				## CALCULATE SPEED HERE
				if prev_hit_timestamp is not None:
					time_diff = hit_timestamp - prev_hit_timestamp
					speed = wheel_circumference / time_diff.total_seconds() ## inches per second
					mph = speed * 3600.0 / 12.0 / 5280.0 ## miles per hour
					rider_speed.value = mph
					print "MPH: ", mph

				prev_hit_timestamp = hit_timestamp
		else :
			prev_hit = False

		cv2.imshow("MASKED", masked)
		cv2.rectangle(frame, p1, p2, (0, 0, 255), 5)
		cv2.imshow("ORIGINAL", frame)

		if cv2.waitKey(1) & 0xFF == ord('q') :
			break

	cap.release()
	cv2.destroyAllWindows()
	
# detect_speed()