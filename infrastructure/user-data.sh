#!/bin/bash
# Update and install software
apt-get update -y && apt-get upgrade -y
apt-get install -y nginx python3-pip python3.10-venv git jq # jq is a tool to parse JSON

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# --- NEW: SECURELY FETCH API KEYS ---
# Use the AWS CLI to get the secrets from Secrets Manager and parse the JSON response
SECRET_JSON=$(aws secretsmanager get-secret-value --secret-id SimulationEngineAPIKeys --region us-east-1 --query SecretString --output text)
OPENAI_KEY=$(echo $SECRET_JSON | jq -r .OPENAI_API_KEY)
ANTHROPIC_KEY=$(echo $SECRET_JSON | jq -r .ANTHROPIC_API_KEY)

# --- Deploy the Backend ---
su - ubuntu -c "git clone https://github.com/Anmolb2004/simulation_engine.git /home/ubuntu/simulation_engine"
cd /home/ubuntu/simulation_engine/backend
su - ubuntu -c "python3 -m venv venv"
su - ubuntu -c "/home/ubuntu/simulation_engine/backend/venv/bin/pip install -r requirements.txt"
su - ubuntu -c "/home/ubuntu/simulation_engine/backend/venv/bin/pip install gunicorn"

# --- Create the .env file using the fetched keys ---
echo "OPENAI_API_KEY=$OPENAI_KEY" > /home/ubuntu/simulation_engine/backend/.env
echo "ANTHROPIC_API_KEY=$ANTHROPIC_KEY" >> /home/ubuntu/simulation_engine/backend/.env
chown ubuntu:ubuntu /home/ubuntu/simulation_engine/backend/.env

# --- Set up systemd service ---
cat <<EOF > /etc/systemd/system/simulation_backend.service
[Unit]
Description=Gunicorn for Simulation Engine Backend
After=network.target
[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/simulation_engine/backend
Environment="PATH=/home/ubuntu/simulation_engine/backend/venv/bin"
ExecStart=/home/ubuntu/simulation_engine/backend/venv/bin/gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 127.0.0.1:8000
[Install]
WantedBy=multi-user.target
EOF
systemctl start simulation_backend
systemctl enable simulation_backend

# --- Deploy the Frontend ---
cd /home/ubuntu/simulation_engine/frontend
su - ubuntu -c "npm install && npm run build"

# --- Configure Nginx ---
cat <<EOF > /etc/nginx/sites-available/simulation_engine
server {
    listen 80;
    server_name _;
    root /home/ubuntu/simulation_engine/frontend/dist;
    index index.html;
    location / {
        try_files \$uri /index.html;
    }
    location /api {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF
ln -s /etc/nginx/sites-available/simulation_engine /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
systemctl restart nginx