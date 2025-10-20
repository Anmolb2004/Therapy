#!/bin/bash
set -e # Exit immediately if a command exits with a non-zero status.
set -x # Print commands and their arguments as they are executed.

# Redirect all output to a log file for easier debugging
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

# Update and install software on Ubuntu
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get upgrade -y
apt-get install -y nginx python3-pip python3-venv git jq awscli

# Install Node.js v20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs

# --- SECURELY FETCH API KEYS ---
# Make sure this region is correct!
SECRET_JSON=$(aws secretsmanager get-secret-value --secret-id SimulationEngineAPIKeys --region us-west-2 --query SecretString --output text)
OPENAI_KEY=$(echo $SECRET_JSON | jq -r .OPENAI_API_KEY)
ANTHROPIC_KEY=$(echo $SECRET_JSON | jq -r .ANTHROPIC_API_KEY)

# --- Deploy the Backend ---
# Clone the repo as the ubuntu user
sudo -u ubuntu git clone https://github.com/Anmolb2004/Therapy.git /home/ubuntu/simulation_engine

# Define project directories
BACKEND_DIR="/home/ubuntu/simulation_engine/backend"
FRONTEND_DIR="/home/ubuntu/simulation_engine/frontend"

# Setup backend as ubuntu user
sudo -u ubuntu python3 -m venv "$BACKEND_DIR/venv"
sudo -u ubuntu "$BACKEND_DIR/venv/bin/pip" install -r "$BACKEND_DIR/requirements.txt"
sudo -u ubuntu "$BACKEND_DIR/venv/bin/pip" install gunicorn uvicorn

# --- Create the .env file ---
# Use printf for safer variable expansion
printf "OPENAI_API_KEY=%s\n" "$OPENAI_KEY" > "$BACKEND_DIR/.env"
printf "ANTHROPIC_API_KEY=%s\n" "$ANTHROPIC_KEY" >> "$BACKEND_DIR/.env"
chown ubuntu:ubuntu "$BACKEND_DIR/.env"

# --- Set up systemd service ---
cat <<EOF > /etc/systemd/system/simulation_backend.service
[Unit]
Description=Gunicorn for Simulation Engine Backend
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=$BACKEND_DIR
# Important: Specify the full path to the python executable in the venv
ExecStart=$BACKEND_DIR/venv/bin/gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app --bind 127.0.0.1:8000

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl start simulation_backend
systemctl enable simulation_backend

# --- Deploy the Frontend ---
# Run npm commands as the ubuntu user in the correct directory
sudo -u ubuntu bash -c "cd $FRONTEND_DIR && npm install && npm run build"

# --- Configure Nginx ---
cat <<EOF > /etc/nginx/sites-available/simulation_engine
server {
    listen 80;
    server_name _;
    root $FRONTEND_DIR/dist;
    index index.html;

    location / {
        try_files \$uri /index.html;
    }

    location ~ ^/(run-simulation|personas) {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
    }
}
EOF

ln -sf /etc/nginx/sites-available/simulation_engine /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
systemctl restart nginx