#!/usr/bin/ruby

source = ARGV[0]
target = ARGV[1]
query = ARGV[2]
target_display_name = ARGV[3]

require 'uri'
require 'net/http'
require 'json'

url = URI("http://127.0.0.1:54234/translate")

http = Net::HTTP.new(url.host, url.port)

request = Net::HTTP::Post.new(url)
request["content-type"] = 'application/json'
request.body = "{ \"q\": \"#{query}\", \"source\": \"#{source}\", \"target\": \"#{target}\" }"

response = http.request(request)
json = JSON.parse(response.read_body)

throw response.read_body unless json['translation']

items = []

if json['suggestion'] && json['suggestion'].length > 0
  items << <<-EOF
    <item uid="translation-suggestion" autocomplete="#{json['suggestion']}">
      <title>#{json['suggestion']}</title>
      <icon>icon.png</icon>
      <subtitle>Did you mean this?</subtitle>
    </item>
  EOF
end

if json['translations']
  json['translations'].each_with_index do |translation, i|
    items << <<-EOF
      <item uid="translation-#{i}" arg="#{translation['translation']}">
        <title>#{translation['translation']}</title>
        <icon>icon.png</icon>
        <subtitle>#{translation['type']} － #{translation['meaning']}</subtitle>
      </item>
    EOF
  end
end

puts <<-EOF
<?xml version="1.0"?>
<items>
  <item uid="translation" arg="#{json['translation']}">
    <title>#{json['translation']}</title>
    <icon>icon.png</icon>
    <subtitle>#{target_display_name}</subtitle>
  </item>
  #{items.join("\n")}
</items>
EOF
