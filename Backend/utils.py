from config import NEO4J_URL
from neo4jrestclient.client import GraphDatabase

gdb = GraphDatabase("http://54.196.96.108:8888/db/data/")

def query_db(query):
	result = gdb.query(q=query, data_contents=True)
	results = {}
	if result.graph:
		results['graph'] = result.graph
	else:
		results['graph'] = 'None'

	if result.rows:
		results['row'] = result.rows
	else:
		results['row'] = 'None'
	return results

def compose_query(raw_query, ingredient):
	query = raw_query.replace('?', ingredient)
	return query
