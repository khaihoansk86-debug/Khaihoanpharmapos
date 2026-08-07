import sys
from bs4 import BeautifulSoup

html = open(r'd:\Khaihoanpharmapos\zalo_html.txt', 'r', encoding='utf-8').read()
soup = BeautifulSoup(html, 'html.parser')

inputs = soup.find_all('input')
print(f'Found {len(inputs)} inputs')
for idx, i in enumerate(inputs):
    print(f'Input {idx}: id={i.get("id")}, class={i.get("class")}, placeholder={i.get("placeholder")}, type={i.get("type")}')
