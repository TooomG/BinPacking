This project is an assignment for an algorithms course at our engineering school, Polytech Nice Sophia.

The problem relates to bin packing : we have containers that have the same dimensions and boxes of various sizes.
The goal is the use the fewest containers as possible to fit all the boxes.
them

== Approach ==
Our method is to sort all the boxes with decreasing height (and decreasing width in case of conflict).
Then, we insert the boxes into the containers, placing them from the top-left corner, from left to right and
from top to bottom.
