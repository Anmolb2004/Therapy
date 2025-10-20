#!/bin/bash
# Update and install software on Ubuntu
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y
# FIX: Added python3-venv, awscli explicitly.
apt-get install -y nginx python3-pip python3-venv git jq awscli

# Install Node.js v20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# --- SECURELY FETCH API KEYS ---
# FIX: Make sure this region is correct!
SECRET_JSON=$(aws secretsmanager get-secret-value --secret-id SimulationEngineAPIKeys --region us-west-2 --query SecretString --output text)
OPENAI_KEY=$(echo $SECRET_JSON | jq -r .OPENAI_API_KEY)
ANTHROPIC_KEY=$(echo $SECRET_JSON | jq -r .ANTHROPIC_API_KEY)

# --- Deploy the Backend ---
# FIX: Cloned the correct repo URL
su - ubuntu -c "git clone https://github.com/Anmolb2004/Therapy.git /home/ubuntu/simulation_engine"

# FIX: Run commands inside the correct directory by combining cd and the command
su - ubuntu -c "cd /home/ubuntu/simulation_engine/backend && python3 -m venv venv"
su - ubuntu -c "cd /home/ubuntu/simulation_engine/backend && venv/bin/pip install -r requirements.txt"
su - ubuntu -c "cd /home/ubuntu/simulation_engine/backend && venv/bin/pip install gunicorn uvicorn"

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

systemctl daemon-reload
systemctl start simulation_backend
systemctl enable simulation_backend

# --- Deploy the Frontend ---
# FIX: Run npm commands inside the correct frontend directory
su - ubuntu -c "cd /home/ubuntu/simulation_engine/frontend && npm install && npm run build"

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

    # FIX: Correctly proxy the API endpoints defined in main.py
    location ~ ^/(run-simulation|personas) {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF

ln -s /etc/nginx/sites-available/simulation_engine /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
systemctl restart nginx