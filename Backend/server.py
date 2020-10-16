"""
	Using flask as backend framework.
	Copyright @ University of Florida.
"""

from flask import Flask, jsonify, request
from flask_cors import CORS

import sys
import utils as utils
from flask_compress import Compress

compress = Compress()

def start_app():
	app = Flask(__name__)
	"""Solve the cors problem"""
	CORS(app)
	compress.init_app(app)
	return app

APP = start_app()


@APP.route('/api/v1/query', methods = ['POST'])
def query():
	query = request.get_json()['query']
	result = utils.query_db(query)
	return jsonify(result)

@APP.route('/api/v1/question', methods = ['POST'])
def question():
	request_json = request.get_json()
	print (request_json)
	row_query = request_json['question']
	ingredient = request_json['ingredient']
	query = utils.compose_query(row_query, ingredient)
	print (jsonify({'query': query}))
	return jsonify({'query': query})

if __name__ == "__main__":
   	# production setting
   	# from werkzeug.contrib.fixers import ProxyFix
	# APP.wsgi_app = ProxyFix(APP.wsgi_app)
	APP.run()
