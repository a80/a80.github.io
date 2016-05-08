import cv2
import numpy as np

cap = cv2.VideoCapture(0)

prev_frame = None

## BGR
lower_red = np.array([0, 50, 50])
higher_red = np.array([10, 255, 255])

while (True) :
	_, frame = cap.read()

	hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

	if prev_frame is not None :

		masked = cv2.inRange(hsv, lower_red, higher_red)
		cv2.imshow("masked", masked)

	prev_frame = frame

	if cv2.waitKey(1) & 0xFF == ord('q') :
		break

cap.release()
cv2.destroyAllWindows()
